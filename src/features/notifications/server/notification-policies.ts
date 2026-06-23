import "server-only";

import { getPolicy } from "@/features/notifications/server/notification-events";
import type { NotificationType } from "@/features/notifications/types/notification-types";
import { resolvePreferences } from "@/features/profile/preferences";
import type { Profile } from "@/generated/prisma/client";

export type ChannelDecision = {
  /** In-app row is always created (source of truth); kept here for symmetry. */
  inApp: boolean;
  /** Whether the PUSH channel is permitted for this event + recipient. */
  push: boolean;
  /** Human-readable reason a channel was skipped (for delivery audit records). */
  pushSkipReason?: "preference_off" | "category_off" | "channel_disabled" | "unknown_event";
};

/**
 * Decide which channels an event may use for a given recipient, combining the
 * event's policy (channels + priority) with the recipient's stored preferences.
 * Subscription existence is checked separately by the delivery layer — "push
 * allowed" here does not guarantee a device is reachable.
 *
 * In-app is always allowed (the record is the source of truth). Push requires:
 * the policy to list PUSH, the master `pushEnabled` switch, and the event's
 * category toggle — except CRITICAL events, which bypass the category toggle
 * (but still honour the master switch).
 */
export function decideChannels(
  type: NotificationType,
  recipient: Pick<Profile, "preferences">,
): ChannelDecision {
  const policy = getPolicy(type);
  if (!policy) {
    return { inApp: true, push: false, pushSkipReason: "unknown_event" };
  }

  if (!policy.channels.includes("PUSH")) {
    return { inApp: true, push: false, pushSkipReason: "channel_disabled" };
  }

  const prefs = resolvePreferences(recipient).dashboardNotifications;

  if (!prefs.pushEnabled) {
    return { inApp: true, push: false, pushSkipReason: "preference_off" };
  }

  // CRITICAL events ignore the per-category toggle (master switch still applies).
  if (policy.priority !== "CRITICAL" && policy.pushCategory) {
    const categoryOn = prefs[policy.pushCategory];
    if (!categoryOn) {
      return { inApp: true, push: false, pushSkipReason: "category_off" };
    }
  }

  return { inApp: true, push: true };
}
