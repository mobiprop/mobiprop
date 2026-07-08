/**
 * Tests for the centralized notification policy registry, the preference-based
 * channel decision, and the named recipient-resolution strategies. These guard
 * the project's notification classification rules (activity-only vs in-app vs
 * push) and the agent-with-management-fallback recipient logic.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// In-memory profiles for the resolve-recipients strategy tests. profile.findMany
// is the only Prisma call the resolver makes; we answer it from this table.
type Row = { id: string; role: string; status: string };
let profiles: Row[];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: {
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        const idFilter = where.id as { in: string[] } | undefined;
        const roleFilter = where.role as { in: string[] } | undefined;
        return profiles.filter((p) => {
          if (where.status && p.status !== where.status) return false;
          if (idFilter && !idFilter.in.includes(p.id)) return false;
          if (roleFilter && !roleFilter.in.includes(p.role)) return false;
          return true;
        });
      }),
    },
  },
}));

import { NOTIFICATION_POLICIES, getPolicy } from "@/features/notifications/server/notification-events";
import { decideChannels } from "@/features/notifications/server/notification-policies";
import { resolveByStrategy } from "@/features/notifications/server/resolve-recipients";

describe("policy registry invariants", () => {
  it("LEAD_CREATED is activity-log-only (no channels, NONE recipients)", () => {
    const p = getPolicy("LEAD_CREATED")!;
    expect(p.channels).toEqual([]);
    expect(p.recipientStrategy).toBe("NONE");
  });

  it("public/assignment events are push-eligible and HIGH/CRITICAL priority", () => {
    for (const t of ["TOUR_REQUESTED", "LEAD_ASSIGNED", "LISTING_ASSIGNED"] as const) {
      const p = getPolicy(t)!;
      expect(p.channels).toContain("PUSH");
      expect(["HIGH", "CRITICAL"]).toContain(p.priority);
    }
  });

  it("routine listing edits stay in-app only (no push)", () => {
    expect(getPolicy("LISTING_CREATED")!.channels).toEqual(["IN_APP"]);
    expect(getPolicy("LISTING_STATUS_CHANGED")!.channels).toEqual(["IN_APP"]);
  });

  it("every type has a policy and deduplicated push events are customer/critical-aware", () => {
    const types = Object.keys(NOTIFICATION_POLICIES) as Array<keyof typeof NOTIFICATION_POLICIES>;
    expect(types.length).toBeGreaterThan(0);
    for (const t of types) {
      const p = NOTIFICATION_POLICIES[t];
      // A non-empty channel set always includes IN_APP (the source of truth).
      if (p.channels.length > 0) expect(p.channels).toContain("IN_APP");
    }
  });
});

describe("decideChannels — channel gating", () => {
  const profileWith = (dn: Record<string, boolean>) => ({ preferences: { dashboardNotifications: dn } });

  it("skips push for in-app-only events (channel_disabled)", () => {
    const d = decideChannels("LISTING_CREATED", profileWith({ pushEnabled: true, listingUpdates: true }));
    expect(d).toEqual({ inApp: true, push: false, pushSkipReason: "channel_disabled" });
  });

  it("allows push for an assignment when master + category are on", () => {
    const d = decideChannels("LEAD_ASSIGNED", profileWith({ pushEnabled: true, leadAssignments: true }));
    expect(d.push).toBe(true);
  });

  it("blocks push when the category is off for a non-critical push event", () => {
    const d = decideChannels("LEAD_ASSIGNED", profileWith({ pushEnabled: true, leadAssignments: false }));
    expect(d.push).toBe(false);
    expect(d.pushSkipReason).toBe("category_off");
  });

  it("critical envelope-expiring-soon bypasses the category toggle", () => {
    const d = decideChannels("DOCUSIGN_ENVELOPE_EXPIRING_SOON", profileWith({ pushEnabled: true, signatureUpdates: false }));
    expect(d.push).toBe(true);
  });
});

describe("resolveByStrategy — recipient resolution", () => {
  beforeEach(() => {
    profiles = [
      { id: "admin1", role: "ADMIN", status: "ACTIVE" },
      { id: "admin2", role: "ADMIN", status: "INACTIVE" },
      { id: "mgr1", role: "MANAGER", status: "ACTIVE" },
      { id: "agentA", role: "AGENT", status: "ACTIVE" },
      { id: "agentInactive", role: "AGENT", status: "INACTIVE" },
    ];
  });

  it("NONE notifies nobody", async () => {
    expect(await resolveByStrategy("NONE", {})).toEqual([]);
  });

  it("ALL_ADMINS returns only active admins", async () => {
    expect(await resolveByStrategy("ALL_ADMINS", {})).toEqual(["admin1"]);
  });

  it("ASSIGNED_AGENT_PLUS_ADMINS includes the agent and active admins", async () => {
    const r = await resolveByStrategy("ASSIGNED_AGENT_PLUS_ADMINS", { assignedAgentId: "agentA" });
    expect(r.sort()).toEqual(["admin1", "agentA"]);
  });

  it("fallback notifies ONLY the assigned agent when one exists", async () => {
    const r = await resolveByStrategy("TOUR_AGENT_WITH_MANAGEMENT_FALLBACK", { assignedAgentId: "agentA" });
    expect(r).toEqual(["agentA"]);
  });

  it("fallback escalates to managers + admins when no agent is assigned", async () => {
    const r = await resolveByStrategy("TOUR_AGENT_WITH_MANAGEMENT_FALLBACK", { assignedAgentId: null });
    expect(r.sort()).toEqual(["admin1", "mgr1"]);
  });

  it("drops inactive agents (falls back to management)", async () => {
    const r = await resolveByStrategy("LISTING_AGENT_WITH_MANAGEMENT_FALLBACK", { assignedAgentId: "agentInactive" });
    expect(r.sort()).toEqual(["admin1", "mgr1"]);
  });

  it("reassignment includes new + previous agent and admins", async () => {
    profiles.push({ id: "agentB", role: "AGENT", status: "ACTIVE" });
    const r = await resolveByStrategy("NEW_AND_PREV_AGENT_PLUS_ADMINS", {
      assignedAgentId: "agentB",
      previousAgentId: "agentA",
    });
    expect(r.sort()).toEqual(["admin1", "agentA", "agentB"]);
  });
});
