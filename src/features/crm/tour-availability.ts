import "server-only";

import { prisma } from "@/lib/prisma";
import { getValidAccessToken, getFreeBusy } from "@/lib/google-calendar";
import type { Profile } from "@/generated/prisma/client";

// v1: one fixed working-hours window for every agent (Mon–Sat 9:00–18:00,
// server-local time). No per-agent settings UI yet — easy to change here
// later if that becomes a real requirement.
const WORKING_HOURS = {
  days: [1, 2, 3, 4, 5, 6], // Mon–Sat (0 = Sunday, excluded)
  startHour: 9,
  endHour: 18,
};

function isWithinWorkingHours(date: Date): boolean {
  const day = date.getDay();
  const hour = date.getHours() + date.getMinutes() / 60;
  return (
    WORKING_HOURS.days.includes(day) && hour >= WORKING_HOURS.startHour && hour < WORKING_HOURS.endHour
  );
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

async function loadAgentProfile(agentId: string): Promise<Profile | null> {
  return prisma.profile.findUnique({ where: { id: agentId } });
}

/**
 * True if the agent has no connected calendar (always available — unchanged
 * from the pre-integration behavior) or the requested window is free on it.
 */
export async function isSlotAvailable(agentId: string, start: Date, end: Date): Promise<boolean> {
  const agent = await loadAgentProfile(agentId);
  if (!agent) return true;

  const accessToken = await getValidAccessToken(agent);
  if (!accessToken) return true;

  const busy = await getFreeBusy(accessToken, start, end);
  return !busy.some((b) => overlaps(start, end, b.start, b.end));
}

/**
 * Up to `count` alternative free slots of `durationMinutes`, scanning forward
 * from `around` through the next 7 days within working hours. Only ever
 * called after `isSlotAvailable` returned false, which already implies the
 * agent has a connected calendar — an empty result here means a genuinely
 * fully-booked week, not a missing calendar.
 */
export async function findAvailableSlots(
  agentId: string,
  around: Date,
  durationMinutes: number,
  count = 4,
): Promise<string[]> {
  const agent = await loadAgentProfile(agentId);
  if (!agent) return [];

  const accessToken = await getValidAccessToken(agent);
  if (!accessToken) return [];

  const windowStart = new Date(around);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(windowStart);
  windowEnd.setDate(windowEnd.getDate() + 7);

  const busy = await getFreeBusy(accessToken, windowStart, windowEnd);
  const now = new Date();

  // Round up to the next quarter hour so suggested times look tidy.
  const cursor = new Date(around);
  cursor.setSeconds(0, 0);
  const remainder = cursor.getMinutes() % 15;
  if (remainder !== 0) cursor.setMinutes(cursor.getMinutes() + (15 - remainder));

  const slots: string[] = [];

  while (slots.length < count && cursor < windowEnd) {
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60_000);

    const inWorkingHours =
      isWithinWorkingHours(cursor) && isWithinWorkingHours(new Date(slotEnd.getTime() - 60_000));
    const isFuture = cursor > now;
    const isFree = inWorkingHours && isFuture && !busy.some((b) => overlaps(cursor, slotEnd, b.start, b.end));

    if (isFree) slots.push(cursor.toISOString());

    cursor.setMinutes(cursor.getMinutes() + durationMinutes);
  }

  return slots;
}
