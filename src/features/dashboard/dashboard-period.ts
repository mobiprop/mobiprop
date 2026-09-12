import { startOfDay, endOfDay, subDays } from "date-fns";
import type { DashboardDateRangeInput } from "./types/dashboard-dto";

export function resolveDateRange(input: DashboardDateRangeInput, now = new Date()) {
  const end = endOfDay(now);
  let start: Date;

  if (input.dateRange === "CUSTOM" && input.from && input.to) {
    const parsedFrom = startOfDay(new Date(input.from));
    const parsedTo = endOfDay(new Date(input.to));
    if (!Number.isNaN(parsedFrom.getTime()) && !Number.isNaN(parsedTo.getTime()) && parsedFrom <= parsedTo) {
      const spanMs = parsedTo.getTime() - parsedFrom.getTime();
      return {
        start: parsedFrom,
        end: parsedTo,
        prevStart: new Date(parsedFrom.getTime() - spanMs),
        prevEnd: new Date(parsedFrom.getTime() - 1),
      };
    }
  }

  if (input.dateRange === "LAST_WEEK") {
    start = startOfDay(subDays(end, 6));
  } else if (input.dateRange === "30_DAYS") {
    start = startOfDay(subDays(end, 29));
  } else {
    start = startOfDay(subDays(end, 59));
  }

  const spanMs = end.getTime() - start.getTime();
  return {
    start,
    end,
    prevStart: new Date(start.getTime() - spanMs),
    prevEnd: new Date(start.getTime() - 1),
  };
}

export function sparklineFromDates(dates: Date[], start: Date, end: Date, points = 7): number[] {
  const spanMs = Math.max(end.getTime() - start.getTime(), 1);
  const bucketMs = spanMs / points;
  const counts = new Array(points).fill(0) as number[];
  for (const d of dates) {
    const t = d.getTime();
    if (t < start.getTime() || t > end.getTime()) continue;
    const idx = Math.min(points - 1, Math.floor((t - start.getTime()) / bucketMs));
    counts[idx] += 1;
  }
  return counts;
}

export function sparklineFromValues(
  items: { date: Date; value: number }[],
  start: Date,
  end: Date,
  points = 7,
): number[] {
  const spanMs = Math.max(end.getTime() - start.getTime(), 1);
  const bucketMs = spanMs / points;
  const sums = new Array(points).fill(0) as number[];
  for (const { date, value } of items) {
    const t = date.getTime();
    if (t < start.getTime() || t > end.getTime()) continue;
    const idx = Math.min(points - 1, Math.floor((t - start.getTime()) / bucketMs));
    sums[idx] += value;
  }
  return sums;
}


