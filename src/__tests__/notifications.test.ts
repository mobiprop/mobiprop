/**
 * Unit tests for the notification/web-push pure logic: internal-URL validation,
 * VAPID key conversion, provider-status classification + retry schedule, the
 * push payload schema, audience rules, and preference-based channel decisions.
 *
 * All targets are pure (no DB / network); `server-only` is stubbed so the
 * server-tagged modules import cleanly under vitest's node environment.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isInternalUrl } from "@/features/notifications/utils/is-internal-url";
import { urlBase64ToUint8Array } from "@/features/notifications/utils/url-base64-to-uint8-array";
import {
  isGoneStatus,
  isAuthStatus,
  isRetryableStatus,
  nextRetryAt,
  MAX_PUSH_ATTEMPTS,
} from "@/features/notifications/utils/delivery-status";
import { webPushPayloadSchema } from "@/features/notifications/schemas/notification-payload-schema";
import { audienceAllowsRole } from "@/features/notifications/server/notification-events";
import { decideChannels } from "@/features/notifications/server/notification-policies";

describe("isInternalUrl", () => {
  it("accepts same-origin internal paths", () => {
    expect(isInternalUrl("/dashboard/leads/123")).toBe(true);
    expect(isInternalUrl("/dashboard/notifications")).toBe(true);
    expect(isInternalUrl("/")).toBe(true);
    expect(isInternalUrl("/a?b=c#d")).toBe(true);
  });

  it("rejects external, protocol-relative, and scheme URLs", () => {
    expect(isInternalUrl("https://evil.com")).toBe(false);
    expect(isInternalUrl("//evil.com")).toBe(false);
    expect(isInternalUrl("javascript:alert(1)")).toBe(false);
    expect(isInternalUrl("mailto:x@y.com")).toBe(false);
    expect(isInternalUrl("/\\evil.com")).toBe(false);
    expect(isInternalUrl("/path\\with\\backslash")).toBe(false);
  });

  it("rejects non-strings, empty, and control characters", () => {
    expect(isInternalUrl(undefined)).toBe(false);
    expect(isInternalUrl(null)).toBe(false);
    expect(isInternalUrl(42)).toBe(false);
    expect(isInternalUrl("")).toBe(false);
    expect(isInternalUrl("relative/path")).toBe(false);
    expect(isInternalUrl("/has\nnewline")).toBe(false);
  });
});

describe("urlBase64ToUint8Array", () => {
  it("decodes a url-safe base64 VAPID key to the expected bytes", () => {
    // "hello" url-safe base64 -> known byte sequence.
    const result = urlBase64ToUint8Array("aGVsbG8");
    expect(Array.from(result)).toEqual([104, 101, 108, 108, 111]);
  });

  it("handles url-safe chars (-, _) and missing padding", () => {
    const result = urlBase64ToUint8Array("a-_w");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("delivery-status classification", () => {
  it("treats 404/410 as permanently gone", () => {
    expect(isGoneStatus(404)).toBe(true);
    expect(isGoneStatus(410)).toBe(true);
    expect(isGoneStatus(500)).toBe(false);
    expect(isGoneStatus(undefined)).toBe(false);
  });

  it("treats 401/403 as auth/config errors", () => {
    expect(isAuthStatus(401)).toBe(true);
    expect(isAuthStatus(403)).toBe(true);
    expect(isAuthStatus(410)).toBe(false);
  });

  it("treats 408/429/5xx as retryable, others not", () => {
    for (const s of [408, 429, 500, 502, 503, 504]) expect(isRetryableStatus(s)).toBe(true);
    expect(isRetryableStatus(404)).toBe(false);
    expect(isRetryableStatus(200)).toBe(false);
    expect(isRetryableStatus(null)).toBe(false);
  });

  it("schedules backoff after attempts 1 and 2, then stops", () => {
    const from = new Date("2026-06-17T00:00:00.000Z");
    expect(nextRetryAt(1, from)?.toISOString()).toBe("2026-06-17T00:01:00.000Z");
    expect(nextRetryAt(2, from)?.toISOString()).toBe("2026-06-17T00:05:00.000Z");
    expect(nextRetryAt(3, from)).toBeNull();
    expect(MAX_PUSH_ATTEMPTS).toBe(3);
  });
});

describe("webPushPayloadSchema", () => {
  const valid = {
    title: "Lead assigned",
    body: "A new lead has been assigned to you.",
    url: "/dashboard/leads/1",
    notificationId: "abc",
  };

  it("accepts a valid same-origin payload", () => {
    expect(webPushPayloadSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects external URLs", () => {
    expect(webPushPayloadSchema.safeParse({ ...valid, url: "https://evil.com" }).success).toBe(false);
  });

  it("rejects an over-long body", () => {
    expect(webPushPayloadSchema.safeParse({ ...valid, body: "x".repeat(401) }).success).toBe(false);
  });
});

describe("audienceAllowsRole", () => {
  it("STAFF excludes USER, includes staff roles", () => {
    expect(audienceAllowsRole("STAFF", "AGENT")).toBe(true);
    expect(audienceAllowsRole("STAFF", "ADMIN")).toBe(true);
    expect(audienceAllowsRole("STAFF", "USER")).toBe(false);
  });

  it("CLIENT only includes USER; ANY includes all", () => {
    expect(audienceAllowsRole("CLIENT", "USER")).toBe(true);
    expect(audienceAllowsRole("CLIENT", "AGENT")).toBe(false);
    expect(audienceAllowsRole("ANY", "USER")).toBe(true);
    expect(audienceAllowsRole("ANY", "AGENT")).toBe(true);
  });
});

describe("decideChannels (preferences)", () => {
  const profileWith = (dashboardNotifications: Record<string, boolean>) => ({
    preferences: { dashboardNotifications },
  });

  it("disables push when the master switch is off", () => {
    const d = decideChannels("LEAD_ASSIGNED", profileWith({ pushEnabled: false }));
    expect(d).toEqual({ inApp: true, push: false, pushSkipReason: "preference_off" });
  });

  it("disables push when the event category is off", () => {
    const d = decideChannels("TOUR_CONFIRMED", profileWith({ pushEnabled: true, tourUpdates: false }));
    expect(d.push).toBe(false);
    expect(d.pushSkipReason).toBe("category_off");
  });

  it("allows push when master + category are on", () => {
    const d = decideChannels("TOUR_CONFIRMED", profileWith({ pushEnabled: true, tourUpdates: true }));
    expect(d.push).toBe(true);
  });

  it("critical events ignore the category toggle but honour the master switch", () => {
    const d = decideChannels(
      "DOCUSIGN_ENVELOPE_EXPIRING_SOON",
      profileWith({ pushEnabled: true, signatureUpdates: false }),
    );
    expect(d.push).toBe(true);
  });

  it("flags unknown events", () => {
    const d = decideChannels(
      "NOT_A_REAL_EVENT" as never,
      profileWith({ pushEnabled: true }),
    );
    expect(d.push).toBe(false);
    expect(d.pushSkipReason).toBe("unknown_event");
  });
});
