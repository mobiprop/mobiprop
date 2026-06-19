/**
 * Tests for the in-app notification server actions: recipient-scoped reads/writes
 * (a user can never touch another user's row), unread counting, and action-URL
 * sanitization at the DTO boundary.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const db = {
  notification: {
    findMany: vi.fn(),
    count: vi.fn(),
    updateMany: vi.fn(),
  },
};
vi.mock("@/lib/prisma", () => ({ get prisma() { return db; } }));

const requireUserMock = vi.fn();
vi.mock("@/lib/require-user", () => ({ requireUser: () => requireUserMock() }));

import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  dismissNotification,
} from "@/features/dashboard/notification-actions";

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";

beforeEach(() => {
  vi.clearAllMocks();
  requireUserMock.mockResolvedValue({ ok: true, profile: { id: PROFILE_ID } });
});

describe("getMyNotifications", () => {
  it("requests only the caller's non-dismissed rows", async () => {
    db.notification.findMany.mockResolvedValue([]);
    await getMyNotifications();
    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { recipientId: PROFILE_ID, dismissedAt: null },
      }),
    );
  });

  it("passes through safe internal action URLs but nulls unsafe ones", async () => {
    db.notification.findMany.mockResolvedValue([
      { id: "a", type: "LEAD_ASSIGNED", title: "t", body: "b", actionUrl: "/dashboard/leads/1", entityType: "LEAD", entityId: "1", readAt: null, createdAt: new Date() },
      { id: "b", type: "LEAD_ASSIGNED", title: "t", body: "b", actionUrl: "https://evil.com", entityType: "LEAD", entityId: "2", readAt: null, createdAt: new Date() },
    ]);
    const result = await getMyNotifications();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.notifications[0].actionUrl).toBe("/dashboard/leads/1");
      expect(result.notifications[1].actionUrl).toBeNull();
    }
  });

  it("returns an error when unauthenticated", async () => {
    requireUserMock.mockResolvedValue({ ok: false, error: "nope", reason: "unauthenticated" });
    const result = await getMyNotifications();
    expect(result.ok).toBe(false);
    expect(db.notification.findMany).not.toHaveBeenCalled();
  });
});

describe("getUnreadNotificationCount", () => {
  it("counts only unread, non-dismissed rows for the caller", async () => {
    db.notification.count.mockResolvedValue(3);
    const result = await getUnreadNotificationCount();
    expect(result).toEqual({ ok: true, count: 3 });
    expect(db.notification.count).toHaveBeenCalledWith({
      where: { recipientId: PROFILE_ID, readAt: null, dismissedAt: null },
    });
  });
});

describe("markNotificationRead / dismissNotification", () => {
  it("scopes the read update to the caller's row", async () => {
    db.notification.updateMany.mockResolvedValue({ count: 1 });
    await markNotificationRead("note-1");
    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "note-1", recipientId: PROFILE_ID, readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });

  it("scopes the dismiss update to the caller's row", async () => {
    db.notification.updateMany.mockResolvedValue({ count: 1 });
    await dismissNotification("note-2");
    expect(db.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "note-2", recipientId: PROFILE_ID, dismissedAt: null },
      data: { dismissedAt: expect.any(Date) },
    });
  });

  it("does not write when unauthenticated", async () => {
    requireUserMock.mockResolvedValue({ ok: false, error: "nope", reason: "unauthenticated" });
    await markNotificationRead("note-3");
    expect(db.notification.updateMany).not.toHaveBeenCalled();
  });
});
