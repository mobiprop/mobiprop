/**
 * Agent-actions unit tests.
 *
 * Covers:
 *   1. updateAgentStatus logs AGENT_ACTIVATED / AGENT_DEACTIVATED.
 *   2. Deactivating an agent does NOT touch leads or listings (no cascade).
 *   3. Inactive agent cannot be assigned to new leads.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: (fn: unknown) => fn };
});

const mockLogActivity = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/activity-log", () => ({ logActivity: mockLogActivity }));

// Avoid pulling in @/lib/supabase/admin (which eagerly validates Supabase env
// vars at import time) via updateAgentAvatar/removeAgentAvatar's storage import.
vi.mock("@/lib/supabase/storage", () => ({
  uploadAvatar: vi.fn().mockResolvedValue("https://example.com/avatar.jpg"),
  removeAvatar: vi.fn().mockResolvedValue(undefined),
}));

let mockRequirePermissionResult: Record<string, unknown> = {};

vi.mock("@/lib/require-permission", () => ({
  requirePermission: vi.fn(async () => mockRequirePermissionResult),
}));

const mockPrismaProfile = {
  findUnique: vi.fn(),
  update: vi.fn(),
  findMany: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: mockPrismaProfile,
    lead: { count: vi.fn().mockResolvedValue(0) },
    property: {},
    // Used by buildEarningsByAgent() (agent commission earnings rollup).
    opportunity: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

const ADMIN_ID = "admin-id-0000-0000-0000-000000000000";
const AGENT_ID  = "agent-id-0000-0000-0000-000000000000";

beforeEach(() => {
  vi.clearAllMocks();
  mockRequirePermissionResult = {
    ok: true,
    profile: { id: ADMIN_ID, role: "ADMIN", status: "ACTIVE", fullName: "Admin", email: "admin@test.com", avatarUrl: null },
  };
});

const { updateAgentStatus, updateAgent, deleteAgent } = await import("@/features/agents/agent-actions");

// ─────────────────────────────────────────────────────────────────────────────
// 1. updateAgentStatus logs activity
// ─────────────────────────────────────────────────────────────────────────────

describe("updateAgentStatus — activity logging", () => {
  it("logs AGENT_DEACTIVATED with old/new status when deactivating", async () => {
    mockPrismaProfile.findUnique.mockResolvedValue({ id: AGENT_ID, role: "AGENT", status: "ACTIVE" });
    mockPrismaProfile.update.mockResolvedValue({ id: AGENT_ID, status: "INACTIVE" });

    const res = await updateAgentStatus(AGENT_ID, "INACTIVE");
    expect(res.ok).toBe(true);

    expect(mockLogActivity).toHaveBeenCalledOnce();
    const [call] = mockLogActivity.mock.calls;
    expect(call[0].action).toBe("AGENT_DEACTIVATED");
    expect(call[0].entityId).toBe(AGENT_ID);
    expect(call[0].oldValues).toEqual({ status: "ACTIVE" });
    expect(call[0].newValues).toEqual({ status: "INACTIVE" });
    expect(call[0].actorId).toBe(ADMIN_ID);
  });

  it("logs AGENT_ACTIVATED with old/new status when activating", async () => {
    mockPrismaProfile.findUnique.mockResolvedValue({ id: AGENT_ID, role: "AGENT", status: "INACTIVE" });
    mockPrismaProfile.update.mockResolvedValue({ id: AGENT_ID, status: "ACTIVE" });

    const res = await updateAgentStatus(AGENT_ID, "ACTIVE");
    expect(res.ok).toBe(true);

    const [call] = mockLogActivity.mock.calls;
    expect(call[0].action).toBe("AGENT_ACTIVATED");
    expect(call[0].oldValues).toEqual({ status: "INACTIVE" });
    expect(call[0].newValues).toEqual({ status: "ACTIVE" });
  });

  it("returns 404 for USER role (not an agent)", async () => {
    mockPrismaProfile.findUnique.mockResolvedValue({ id: AGENT_ID, role: "USER", status: "ACTIVE" });

    const res = await updateAgentStatus(AGENT_ID, "INACTIVE");
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(404);
    expect(mockLogActivity).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Deactivating an agent does NOT affect leads or listings (no DB cascade)
// ─────────────────────────────────────────────────────────────────────────────

describe("updateAgentStatus — no cascade to leads/listings", () => {
  it("only updates the profile row, never touches leads or properties", async () => {
    mockPrismaProfile.findUnique.mockResolvedValue({ id: AGENT_ID, role: "AGENT", status: "ACTIVE" });
    mockPrismaProfile.update.mockResolvedValue({ id: AGENT_ID, status: "INACTIVE" });

    await updateAgentStatus(AGENT_ID, "INACTIVE");

    // Only profile.findUnique + profile.update should be called.
    expect(mockPrismaProfile.findUnique).toHaveBeenCalledOnce();
    expect(mockPrismaProfile.update).toHaveBeenCalledOnce();
    expect(mockPrismaProfile.update.mock.calls[0][0]).toMatchObject({
      where: { id: AGENT_ID },
      data: { status: "INACTIVE" },
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. updateAgent — name/phone/city/role edit (2026-06-26 Agents UI decision)
// ─────────────────────────────────────────────────────────────────────────────

describe("updateAgent", () => {
  it("logs AGENT_UPDATED with old/new values and returns the updated AgentDto", async () => {
    mockPrismaProfile.findUnique.mockResolvedValue({
      id: AGENT_ID, role: "AGENT", status: "ACTIVE",
      fullName: "Old Name", phone: "111", city: "Old City", email: "agent@test.com",
    });
    mockPrismaProfile.update.mockResolvedValue({
      id: AGENT_ID, role: "MANAGER", status: "ACTIVE",
      fullName: "New Name", phone: "222", city: "New City", email: "agent@test.com",
      createdAt: new Date("2026-01-01"),
    });

    const res = await updateAgent(AGENT_ID, { fullName: "New Name", phone: "222", city: "New City", role: "MANAGER" });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.agent.name).toBe("New Name");
      expect(res.agent.role).toBe("MANAGER");
    }

    expect(mockLogActivity).toHaveBeenCalledOnce();
    const [call] = mockLogActivity.mock.calls;
    expect(call[0].action).toBe("AGENT_UPDATED");
    expect(call[0].oldValues).toEqual({ fullName: "Old Name", phone: "111", city: "Old City", role: "AGENT" });
    expect(call[0].newValues).toEqual({ fullName: "New Name", phone: "222", city: "New City", role: "MANAGER" });
  });

  it("rejects a role other than AGENT or MANAGER (Admin is never assignable here)", async () => {
    mockPrismaProfile.findUnique.mockResolvedValue({ id: AGENT_ID, role: "AGENT", status: "ACTIVE", fullName: "X", phone: null, city: null, email: "agent@test.com" });

    const res = await updateAgent(AGENT_ID, { role: "ADMIN" as never });
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(400);
    expect(mockPrismaProfile.update).not.toHaveBeenCalled();
  });

  it("returns 404 for USER role (not an agent)", async () => {
    mockPrismaProfile.findUnique.mockResolvedValue({ id: AGENT_ID, role: "USER", status: "ACTIVE" });

    const res = await updateAgent(AGENT_ID, { fullName: "New Name" });
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(404);
    expect(mockPrismaProfile.update).not.toHaveBeenCalled();
  });

  it("refuses to change an existing Admin's role, even a non-role field update is fine", async () => {
    mockPrismaProfile.findUnique.mockResolvedValue({
      id: ADMIN_ID, role: "ADMIN", status: "ACTIVE", fullName: "Old Admin", phone: null, city: null, email: "admin2@test.com",
    });

    const blocked = await updateAgent(ADMIN_ID, { role: "MANAGER" });
    expect(blocked.ok).toBe(false);
    expect((blocked as { status: number }).status).toBe(403);
    expect(mockPrismaProfile.update).not.toHaveBeenCalled();

    mockPrismaProfile.update.mockResolvedValue({
      id: ADMIN_ID, role: "ADMIN", status: "ACTIVE", fullName: "New Admin Name", phone: null, city: null, email: "admin2@test.com",
      createdAt: new Date("2026-01-01"),
    });
    const allowed = await updateAgent(ADMIN_ID, { fullName: "New Admin Name" });
    expect(allowed.ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. deleteAgent
// ─────────────────────────────────────────────────────────────────────────────

describe("deleteAgent", () => {
  it("deletes the profile row and logs AGENT_DELETED", async () => {
    mockPrismaProfile.findUnique.mockResolvedValue({
      id: AGENT_ID,
      role: "AGENT",
      status: "PENDING",
      email: "agent@test.com",
    });
    mockPrismaProfile.delete.mockResolvedValue({ id: AGENT_ID });

    const res = await deleteAgent(AGENT_ID);
    expect(res.ok).toBe(true);

    expect(mockPrismaProfile.delete).toHaveBeenCalledOnce();
    expect(mockPrismaProfile.delete.mock.calls[0][0]).toMatchObject({ where: { id: AGENT_ID } });

    expect(mockLogActivity).toHaveBeenCalledOnce();
    const [call] = mockLogActivity.mock.calls;
    expect(call[0].action).toBe("AGENT_DELETED");
    expect(call[0].entityId).toBe(AGENT_ID);
    expect(call[0].actorId).toBe(ADMIN_ID);
  });

  it("returns 404 for USER role (not an agent)", async () => {
    mockPrismaProfile.findUnique.mockResolvedValue({ id: AGENT_ID, role: "USER", status: "ACTIVE" });

    const res = await deleteAgent(AGENT_ID);
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(404);
    expect(mockPrismaProfile.delete).not.toHaveBeenCalled();
  });

  it("returns 404 when the agent does not exist", async () => {
    mockPrismaProfile.findUnique.mockResolvedValue(null);

    const res = await deleteAgent(AGENT_ID);
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(404);
    expect(mockPrismaProfile.delete).not.toHaveBeenCalled();
  });

  it("refuses to let an admin delete their own account", async () => {
    const res = await deleteAgent(ADMIN_ID);
    expect(res.ok).toBe(false);
    expect((res as { status: number }).status).toBe(400);
    expect(mockPrismaProfile.findUnique).not.toHaveBeenCalled();
    expect(mockPrismaProfile.delete).not.toHaveBeenCalled();
  });
});
