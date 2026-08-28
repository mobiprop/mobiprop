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

// createAgentInvitation now also checks Supabase Auth for an orphaned user
// holding the email (item #17). Default: no auth user owns the address.
const mockListUsers = vi.fn().mockResolvedValue({ data: { users: [] }, error: null });
const mockDeleteUser = vi.fn().mockResolvedValue({ error: null });
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: { admin: { listUsers: mockListUsers, deleteUser: mockDeleteUser } },
  })),
}));
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

/**
 * Item #17: an agent deleted before deleteAgent() also removed the Supabase
 * Auth user leaves a login with no profile. It's invisible in the dashboard but
 * still owns the email, so re-inviting that person used to succeed here and
 * then fail at the very last step with Supabase's "A user with this email
 * address has already been registered".
 */
describe("createAgentInvitation — orphaned auth users (item #17)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfile.findUnique.mockResolvedValue(null);
    mockAgentInvitation.updateMany.mockResolvedValue({ count: 0 });
    mockAgentInvitation.create.mockResolvedValue({ id: "inv-1", email: "x@test.com" });
    mockListUsers.mockResolvedValue({ data: { users: [] }, error: null });
    mockDeleteUser.mockResolvedValue({ error: null });
  });

  it("clears an auth user that has no profile, so the invite can proceed", async () => {
    grantAs("ADMIN", "admin-1");
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: "orphan-1", email: "returning@test.com" }] },
      error: null,
    });
    // No profile for that id -> it's an orphan.
    mockProfile.findUnique.mockResolvedValue(null);

    const res = await createAgentInvitation({ email: "returning@test.com", role: "AGENT" });

    expect(mockDeleteUser).toHaveBeenCalledWith("orphan-1");
    expect(res.ok).toBe(true);
    expect(mockAgentInvitation.create).toHaveBeenCalledOnce();
  });

  it("never deletes an auth user that still has a profile — that's a real duplicate", async () => {
    grantAs("ADMIN", "admin-1");
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: "live-1", email: "taken@test.com" }] },
      error: null,
    });
    // First call = the by-email duplicate check (null so we reach the auth
    // check), second = the by-id lookup, which finds a live profile.
    mockProfile.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "live-1", email: "taken@test.com" });

    const res = await createAgentInvitation({ email: "taken@test.com", role: "AGENT" });

    expect(mockDeleteUser).not.toHaveBeenCalled();
    expect(res.ok).toBe(false);
    expect(mockAgentInvitation.create).not.toHaveBeenCalled();
  });
});
