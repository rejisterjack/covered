import { describe, expect, it } from "vitest";

import { compareHotBills, utcDayStart } from "@/lib/hot";

describe("hot ranking", () => {
  it("uses the UTC calendar day, not a rolling 24-hour window", () => {
    const now = new Date("2026-11-06T18:30:00.000Z");

    expect(utcDayStart(now).toISOString()).toBe("2026-11-06T00:00:00.000Z");
  });

  it("ranks today's cover taps ahead of views", () => {
    const ranked = [
      { id: "views", coverTapsToday: 1, viewsToday: 40, createdAt: new Date("2026-11-06T01:00:00Z") },
      { id: "taps", coverTapsToday: 3, viewsToday: 1, createdAt: new Date("2026-11-06T02:00:00Z") },
      { id: "quiet", coverTapsToday: 0, viewsToday: 0, createdAt: new Date("2026-11-06T03:00:00Z") },
    ].sort(compareHotBills);

    expect(ranked.map((bill) => bill.id)).toEqual(["taps", "views", "quiet"]);
  });

  it("breaks view ties with the newer bill", () => {
    const ranked = [
      { id: "older", coverTapsToday: 2, viewsToday: 5, createdAt: new Date("2026-11-06T01:00:00Z") },
      { id: "newer", coverTapsToday: 2, viewsToday: 5, createdAt: new Date("2026-11-06T09:00:00Z") },
    ].sort(compareHotBills);

    expect(ranked.map((bill) => bill.id)).toEqual(["newer", "older"]);
  });
});
