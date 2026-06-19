import "server-only";

import { getEventDef } from "@/features/notifications/server/notification-events";
import type { NotificationType } from "@/features/notifications/types/notification-types";
import { resolvePreferences } from "@/features/profile/preferences";
import type { Profile } from "@/generated/prisma/client";

export type ChannelDecision = {
  /** In-app row is always created (source of truth); kept here for symmetry. */
  inApp: boolean;
  /** Whether the PUSH channel is permitted by the recipient's preferences. */
  push: boolean;
  /** Human-readable reason a channel was skipped (for delivery audit records). */
  pushSkipReason?: "preference_off" | "category_off" | "unknown_event";
};

/**
 * Decide which channels an event may use for a given recipient, based purely on
 * their stored preferences. Subscription existence is checked separately by the
 * delivery layer — "push allowed" here does not guarantee a device is reachable.
 *
 * In-app is always allowed (the record is the source of truth). Push requires
 * the master `pushEnabled` switch plus the event's category toggle. Critical
 * events still honour the master push switch but ignore the category toggle.
 */
export function decideChannels(
  type: NotificationType,
  recipient: Pick<Profile, "preferences">,
): ChannelDecision {
  const def = getEventDef(type);
  if (!def) {
    return { inApp: true, push: false, pushSkipReason: "unknown_event" };
  }

  const prefs = resolvePreferences(recipient).dashboardNotifications;

  if (!prefs.pushEnabled) {
    return { inApp: true, push: false, pushSkipReason: "preference_off" };
  }

  if (def.category && !def.critical) {
    const categoryOn = prefs[def.category];
    if (!categoryOn) {
      return { inApp: true, push: false, pushSkipReason: "category_off" };
    }
  }

  return { inApp: true, push: true };
}
