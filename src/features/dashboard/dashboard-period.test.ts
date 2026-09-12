import { describe, expect, it } from "vitest";
import { differenceInCalendarDays } from "date-fns";
import { resolveDateRange, sparklineFromValues } from "./dashboard-period";

describe("dashboard reporting periods", () => {
  const now = new Date(2026, 8, 11, 12);
  it.each([["LAST_WEEK", 7], ["30_DAYS", 30], ["60_DAYS", 60]] as const)("%s covers exactly %i calendar days", (dateRange, days) => {
    const { start, end } = resolveDateRange({ dateRange }, now);
    expect(differenceInCalendarDays(end, start) + 1).toBe(days);
  });
  it("keeps last week's revenue flat when only older deals exist", () => {
    const { start, end } = resolveDateRange({ dateRange: "LAST_WEEK" }, now);
    expect(sparklineFromValues([{ date: new Date(2026, 7, 3), value: 1152 }], start, end)).toEqual([0,0,0,0,0,0,0]);
  });
  it("includes boundary values and excludes revenue outside a custom period", () => {
    const { start, end } = resolveDateRange({ dateRange: "CUSTOM", from: "2026-08-01", to: "2026-08-31" }, now);
    const series = sparklineFromValues([{date:start,value:10},{date:end,value:20},{date:new Date(end.getTime()+1),value:100}],start,end);
    expect(series[0]).toBe(10);
    expect(series[6]).toBe(20);
    expect(series.reduce((a,b)=>a+b,0)).toBe(30);
  });
});
