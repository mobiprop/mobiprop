import "server-only";

// Minimal Google Calendar REST client — plain fetch calls, mirroring the
// lightweight style of src/lib/maps.ts rather than pulling in the full
// `googleapis` SDK for a handful of endpoints (token exchange/refresh,
// freebusy.query, events.insert/patch/delete).

import { getGoogleCalendarOAuthConfig } from "@/lib/env";
import { decrypt, encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import type { Profile } from "@/generated/prisma/client";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export type TokenResponse = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
};

export type BusyInterval = { start: Date; end: Date };

export type GoogleCalendarEventInput = {
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
};

export function getAuthorizeUrl(state: string): string {
  const config = getGoogleCalendarOAuthConfig();
  if (!config) throw new Error("Google Calendar OAuth is not configured");

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: CALENDAR_SCOPE,
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const config = getGoogleCalendarOAuthConfig();
  if (!config) throw new Error("Google Calendar OAuth is not configured");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const config = getGoogleCalendarOAuthConfig();
  if (!config) throw new Error("Google Calendar OAuth is not configured");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token refresh failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };

  return {
    accessToken: data.access_token,
    refreshToken: null,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function getGoogleAccountEmail(accessToken: string): Promise<string | null> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { email?: string };
  return data.email ?? null;
}

export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: "POST",
    });
  } catch {
    // Best-effort — disconnecting locally still clears our stored tokens either way.
  }
}

/**
 * Returns a valid access token for the profile's connected Google Calendar,
 * refreshing and persisting it first if the stored one has expired. Returns
 * null if the profile hasn't connected a calendar — every call site treats
 * that as "no calendar to check/sync, proceed as before".
 */
export async function getValidAccessToken(profile: Profile): Promise<string | null> {
  if (!profile.googleCalendarRefreshToken || !profile.googleCalendarAccessToken) return null;

  const expiresAt = profile.googleCalendarTokenExpiresAt;
  const isExpired = !expiresAt || expiresAt.getTime() <= Date.now() + 60_000;

  if (!isExpired) {
    return decrypt(profile.googleCalendarAccessToken);
  }

  const refreshToken = decrypt(profile.googleCalendarRefreshToken);
  const refreshed = await refreshAccessToken(refreshToken);

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      googleCalendarAccessToken: encrypt(refreshed.accessToken),
      googleCalendarTokenExpiresAt: refreshed.expiresAt,
    },
  });

  return refreshed.accessToken;
}

export async function getFreeBusy(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
): Promise<BusyInterval[]> {
  const response = await fetch(`${CALENDAR_API}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: "primary" }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Google freeBusy query failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as {
    calendars: { primary?: { busy: { start: string; end: string }[] } };
  };
  const busy = data.calendars.primary?.busy ?? [];
  return busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

export async function createEvent(
  accessToken: string,
  event: GoogleCalendarEventInput,
): Promise<string> {
  const response = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: { dateTime: event.start.toISOString() },
      end: { dateTime: event.end.toISOString() },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google event create failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { id: string };
  return data.id;
}

export async function patchEventTime(
  accessToken: string,
  eventId: string,
  start: Date,
  end: Date,
): Promise<void> {
  const response = await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google event update failed: ${response.status} ${await response.text()}`);
  }
}

export async function deleteEvent(accessToken: string, eventId: string): Promise<void> {
  const response = await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // 404/410 means the event is already gone — fine, not an error for our purposes.
  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw new Error(`Google event delete failed: ${response.status} ${await response.text()}`);
  }
}
