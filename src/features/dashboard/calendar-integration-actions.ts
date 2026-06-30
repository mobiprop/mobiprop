import "server-only";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { logActivity } from "@/lib/activity-log";
import { decrypt } from "@/lib/crypto";
import { revokeToken } from "@/lib/google-calendar";

export type CalendarActionError = { ok: false; error: string; status: number };
export type CalendarActionResult<T> = ({ ok: true } & T) | CalendarActionError;

export type GoogleCalendarStatus = {
  connected: boolean;
  email: string | null;
};

/** Connection status for the current logged-in profile (the connection is per staff member). */
export async function getGoogleCalendarStatus(): Promise<CalendarActionResult<{ status: GoogleCalendarStatus }>> {
  const gate = await requireUser();
  if (!gate.ok) return { ok: false, error: gate.error, status: gate.reason === "unauthenticated" ? 401 : 403 };

  const profile = await prisma.profile.findUnique({
    where: { id: gate.profile.id },
    select: { googleCalendarRefreshToken: true, googleCalendarEmail: true },
  });

  return {
    ok: true,
    status: {
      connected: Boolean(profile?.googleCalendarRefreshToken),
      email: profile?.googleCalendarEmail ?? null,
    },
  };
}

export async function disconnectGoogleCalendar(): Promise<CalendarActionResult<{ ok: true }>> {
  const gate = await requireUser();
  if (!gate.ok) return { ok: false, error: gate.error, status: gate.reason === "unauthenticated" ? 401 : 403 };

  const profile = await prisma.profile.findUnique({
    where: { id: gate.profile.id },
    select: { googleCalendarAccessToken: true },
  });

  if (profile?.googleCalendarAccessToken) {
    await revokeToken(decrypt(profile.googleCalendarAccessToken));
  }

  await prisma.profile.update({
    where: { id: gate.profile.id },
    data: {
      googleCalendarEmail: null,
      googleCalendarAccessToken: null,
      googleCalendarRefreshToken: null,
      googleCalendarTokenExpiresAt: null,
      googleCalendarConnectedAt: null,
    },
  });

  await logActivity({
    actorId: gate.profile.id,
    action: "GOOGLE_CALENDAR_DISCONNECTED",
    entityType: "PROFILE",
    entityId: gate.profile.id,
  });

  return { ok: true };
}
