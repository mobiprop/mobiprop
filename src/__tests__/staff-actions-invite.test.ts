/**
 * createAgentInvitation — Admin-invite gating (2026-07-08).
 *
 * Covers the new invitations:inviteAdmin gate added alongside the ability to
 * invite an ADMIN-role staff member:
 *   1. An ADMIN inviter can create an ADMIN invitation.
 *   2. A non-ADMIN inviter (defense-in-depth: agents:invite is ADMIN-only
 *      today, but this guards the case it's ever extended to MANAGER) is
 *      blocked from inviting an ADMIN, and never blocked from inviting an AGENT.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockAgentInvitation = {
  updateMany: vi.fn().mockResolvedValue({ count: 0 }),
  create: vi.fn(),
};
const mockProfile = { findUnique: vi.fn().mockResolvedValue(null) };

vi.mock("@/lib/prisma", () => ({
  prisma: { agentInvitation: mockAgentInvitation, profile: mockProfile },
}));

vi.mock("@/lib/activity-log", () => ({ logActivity: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/features/notifications/server/notify-events", () => ({
  notifyInvitationAccepted: vi.fn().mockResolvedValue(undefined),
  notifyInvitationCreated: vi.fn().mockResolvedValue(undefined),
  notifyInvitationRevoked: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email", () => ({
  sendAgentInvitationEmail: vi.fn().mockResolvedValue({ sent: true }),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/storage", () => ({
  promoteInvitationAvatar: vi.fn(),
  uploadInvitationAvatar: vi.fn(),
}));

let mockRequirePermissionResult: Record<string, unknown> = {};
vi.mock("@/lib/require-permission", () => ({
  requirePermission: vi.fn(async () => mockRequirePermissionResult),
}));

function grantAs(role: "ADMIN" | "MANAGER" | "AGENT", id: string) {
  mockRequirePermissionResult = {
    ok: true,
    profile: { id, role, status: "ACTIVE", fullName: `Test ${role}`, email: `${role.toLowerCase()}@test.com` },
  };
}

const { createAgentInvitation } = await import("@/features/auth/staff-actions");

beforeEach(() => {
  vi.clearAllMocks();
  mockProfile.findUnique.mockResolvedValue(null);
  mockAgentInvitation.updateMany.mockResolvedValue({ count: 0 });
  mockAgentInvitation.create.mockResolvedValue({ id: "inv-1" });
});

describe("createAgentInvitation — ADMIN role gating", () => {
  it("an ADMIN inviter can create an ADMIN invitation", async () => {
    grantAs("ADMIN", "admin-1");

    const res = await createAgentInvitation({ email: "newadmin@test.com", role: "ADMIN" });

    expect(res.ok).toBe(true);
    expect(mockAgentInvitation.create).toHaveBeenCalledOnce();
    expect(mockAgentInvitation.create.mock.calls[0][0]).toMatchObject({
      data: expect.objectContaining({ role: "ADMIN" }),
    });
  });

  it("a non-ADMIN inviter is blocked from inviting an ADMIN", async () => {
    grantAs("MANAGER", "manager-1");

    const res = await createAgentInvitation({ email: "newadmin@test.com", role: "ADMIN" });

    expect(res.ok).toBe(false);
    expect(mockAgentInvitation.create).not.toHaveBeenCalled();
  });

  it("a non-ADMIN inviter can still invite an AGENT", async () => {
    grantAs("MANAGER", "manager-1");

    const res = await createAgentInvitation({ email: "newagent@test.com", role: "AGENT" });

    expect(res.ok).toBe(true);
    expect(mockAgentInvitation.create).toHaveBeenCalledOnce();
  });
});
