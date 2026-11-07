import { dayKey } from "@/lib/rank";

export type HotActivity = {
  coverTapsToday: number;
  viewsToday: number;
  createdAt?: Date;
};

/** UTC midnight for the calendar day used by Hot and streaks. */
export function utcDayStart(now = new Date()) {
  return new Date(`${dayKey(now)}T00:00:00.000Z`);
}

/** Cover taps today, then views today, then newer bills. */
export function compareHotBills(a: HotActivity, b: HotActivity) {
  const byTaps = b.coverTapsToday - a.coverTapsToday;

  if (byTaps !== 0) return byTaps;

  const byViews = b.viewsToday - a.viewsToday;

  if (byViews !== 0) return byViews;

  return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
}
