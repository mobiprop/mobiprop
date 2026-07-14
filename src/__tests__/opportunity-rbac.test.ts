/**
 * Opportunity record-scoping unit tests (2026-06-26 Milestone 3 decision;
 * team-based MANAGER scoping added 2026-07-02).
 *
 * Unlike Contacts/Leads (which AGENT now sees in full), Opportunities stay
 * scoped to an agent's own/assigned records — the one place AGENT visibility
 * is deliberately restricted. Covers:
 *   1. listOpportunities — AGENT gets an own/assigned OR scope; MANAGER gets
 *      an own+team OR scope (resolveOwnerScopeIds); ADMIN gets none.
 *   2. updateOpportunity — AGENT/MANAGER are blocked (403) from updating a
 *      record outside their scope; ADMIN can update any record.
 */

import { describe, it, expect, vi, beforeEach, type MockInstance } from "vitest";

vi.mock("server-only", () => ({}));

type MockFn = MockInstance;

const db = {
  opportunity: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  // buildAgentMap() looks up assignedAgentId display names after create/update.
  profile: { findMany: vi.fn().mockResolvedValue([]) },
  $queryRaw: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ get prisma() { return db; } }));

const mockRequirePermission = vi.fn();
vi.mock("@/lib/require-permission", () => ({
  get requirePermission() { return mockRequirePermission; },
}));

vi.mock("@/lib/activity-log", () => ({ logActivity: vi.fn().mockResolvedValue(undefined) }));

// notify-events.ts transitively imports send-web-push.ts -> env.ts, which
// throws at module-load time outside a real runtime env — stub it out so
// importing opportunity-actions doesn't pull that chain in.
vi.mock("@/features/notifications/server/notify-events", () => ({
  notifyOpportunityClosed: vi.fn().mockResolvedValue(undefined),
  notifyOpportunityStageChanged: vi.fn().mockResolvedValue(undefined),
}));

function grantAs(role: "ADMIN" | "MANAGER" | "AGENT", id: string) {
  mockRequirePermission.mockResolvedValue({
    ok: true,
    profile: { id, role, status: "ACTIVE", fullName: `Test ${role}`, email: `${role.toLowerCase()}@test.com`, avatarUrl: null },
  });
}

const AGENT_A_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const AGENT_B_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const ADMIN_ID   = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const MANAGER_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const { listOpportunities, updateOpportunity } = await import("@/features/crm/opportunity-actions");

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no team members for any MANAGER (resolveOwnerScopeIds's
  // teamLeaderId lookup) and no agent rows for buildAgentMap's id-in lookup.
  // Tests that need a team member override this with mockImplementationOnce.
  db.profile.findMany.mockResolvedValue([]);
});

function scopeOr(where: Record<string, unknown> | undefined): Record<string, unknown>[] | undefined {
  return where?.OR as Record<string, unknown>[] | undefined;
}

describe("listOpportunities — record scope", () => {
  it("scopes to own/assigned for AGENT", async () => {
    grantAs("AGENT", AGENT_A_ID);
    db.opportunity.findMany.mockResolvedValue([]);

    await listOpportunities();

    const [call] = (db.opportunity.findMany as MockFn).mock.calls;
    const or = scopeOr(call[0].where);
    expect(or).toContainEqual({ assignedAgentId: { in: [AGENT_A_ID] } });
    expect(or).toContainEqual({ createdById: { in: [AGENT_A_ID] } });
  });

  it("applies no scope for ADMIN", async () => {
    grantAs("ADMIN", ADMIN_ID);
    db.opportunity.findMany.mockResolvedValue([]);

    await listOpportunities();

    const [call] = (db.opportunity.findMany as MockFn).mock.calls;
    expect(call[0].where).toEqual({ isDeleted: false });
  });

  it("scopes MANAGER to self only when they lead no team", async () => {
    grantAs("MANAGER", MANAGER_ID);
    db.opportunity.findMany.mockResolvedValue([]);

    await listOpportunities();

    const [call] = (db.opportunity.findMany as MockFn).mock.calls;
    const or = scopeOr(call[0].where);
    expect(or).toContainEqual({ assignedAgentId: { in: [MANAGER_ID] } });
    expect(or).toContainEqual({ createdById: { in: [MANAGER_ID] } });
  });

  it("scopes MANAGER to self + direct reports", async () => {
    grantAs("MANAGER", MANAGER_ID);
    db.profile.findMany.mockImplementation((args: { where?: { teamLeaderId?: string } }) =>
      Promise.resolve(args?.where?.teamLeaderId ? [{ id: AGENT_A_ID }] : []),
    );
    db.opportunity.findMany.mockResolvedValue([]);

    await listOpportunities();

    const [call] = (db.opportunity.findMany as MockFn).mock.calls;
    const or = scopeOr(call[0].where);
    expect(or).toContainEqual({ assignedAgentId: { in: [MANAGER_ID, AGENT_A_ID] } });
    expect(or).toContainEqual({ createdById: { in: [MANAGER_ID, AGENT_A_ID] } });
  });
});

describe("updateOpportunity — ownership guard", () => {
  it("blocks AGENT from updating an opportunity they don't own/aren't assigned to", async () => {
    grantAs("AGENT", AGENT_B_ID);
    db.opportunity.findUnique.mockResolvedValue({ assignedAgentId: AGENT_A_ID, createdById: AGENT_A_ID });

    const res = await updateOpportunity("opp-1", {});
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(403);
    expect(db.opportunity.update).not.toHaveBeenCalled();
  });

  it("allows AGENT to update their own assigned opportunity", async () => {
    grantAs("AGENT", AGENT_A_ID);
    db.opportunity.findUnique.mockResolvedValue({ assignedAgentId: AGENT_A_ID, createdById: null });
    db.opportunity.update.mockResolvedValue({
      id: "opp-1", opportunityId: "OPP-0001", title: "Test",
      dealType: null, dealSize: null, stage: "QUALIFICATION", status: "OPEN", probability: 50,
      commission: null, commissionUnit: null, paymentTerms: null, contractStart: null, contractEnd: null,
      expectedCloseAt: null, agentCommissionValue: null, agentCommissionUnit: null, notes: null, assignedAgentId: AGENT_A_ID, createdById: null,
      createdAt: new Date(), participants: [], listings: [],
    });

    const res = await updateOpportunity("opp-1", {});
    expect(res.ok).toBe(true);
  });

  it("blocks MANAGER from updating an opportunity owned by an agent outside their team", async () => {
    grantAs("MANAGER", MANAGER_ID);
    // Owned by an agent who is not this Manager's direct report — team-based
    // scoping (2026-07-02) means a Manager no longer bypasses ownership entirely.
    db.opportunity.findUnique.mockResolvedValue({
      isDeleted: false, assignedAgentId: AGENT_A_ID, createdById: AGENT_A_ID,
      title: "Test", stage: "QUALIFICATION", status: "OPEN", dealSize: null,
    });

    const res = await updateOpportunity("opp-1", {});
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(403);
    expect(db.opportunity.update).not.toHaveBeenCalled();
  });

  it("allows MANAGER to update an opportunity owned by their own team member", async () => {
    grantAs("MANAGER", MANAGER_ID);
    db.profile.findMany.mockImplementation((args: { where?: { teamLeaderId?: string } }) =>
      Promise.resolve(args?.where?.teamLeaderId ? [{ id: AGENT_A_ID }] : []),
    );
    db.opportunity.findUnique.mockResolvedValue({
      isDeleted: false, assignedAgentId: AGENT_A_ID, createdById: AGENT_A_ID,
      title: "Test", stage: "QUALIFICATION", status: "OPEN", dealSize: null,
    });
    db.opportunity.update.mockResolvedValue({
      id: "opp-1", opportunityId: "OPP-0001", title: "Test",
      dealType: null, dealSize: null, stage: "QUALIFICATION", status: "OPEN", probability: 50,
      commission: null, commissionUnit: null, paymentTerms: null, contractStart: null, contractEnd: null,
      expectedCloseAt: null, agentCommissionValue: null, agentCommissionUnit: null, notes: null, assignedAgentId: AGENT_A_ID, createdById: null,
      createdAt: new Date(), participants: [], listings: [],
    });

    const res = await updateOpportunity("opp-1", {});
    expect(res.ok).toBe(true);
  });
});
