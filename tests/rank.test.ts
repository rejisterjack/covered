import { describe, expect, it } from "vitest";

import {
  buildLeaderboard,
  currentStreak,
  haversineKm,
  shiftDay,
  streakBadge,
} from "@/lib/rank";

const donor = {
  id: "u1",
  name: "Asha Rao",
  city: "Pune",
  image: null,
  isVerifiedPublic: true,
  isAnonymousDefault: false,
};

describe("streaks", () => {
  it("counts a run that includes today", () => {
    const today = "2026-11-05";

    expect(
      currentStreak(
        [shiftDay(today, -2), shiftDay(today, -1), today],
        new Date(`${today}T12:00:00.000Z`),
      ),
    ).toBe(3);
  });

  it("allows the streak to end yesterday", () => {
    const today = "2026-11-05";

    expect(
      currentStreak(
        [shiftDay(today, -2), shiftDay(today, -1)],
        new Date(`${today}T12:00:00.000Z`),
      ),
    ).toBe(2);
  });

  it("breaks when a day is missing", () => {
    const today = "2026-11-05";

    expect(
      currentStreak([shiftDay(today, -3)], new Date(`${today}T12:00:00.000Z`)),
    ).toBe(0);
  });

  it("badges 7, 14, and 30", () => {
    expect(streakBadge(6)).toBeNull();
    expect(streakBadge(7)).toBe(7);
    expect(streakBadge(14)).toBe(14);
    expect(streakBadge(30)).toBe(30);
  });
});

describe("anonymous leaderboard", () => {
  it("splits a named total from an anonymous cover", () => {
    const board = buildLeaderboard({
      donors: [donor],
      payments: [
        {
          donorId: "u1",
          amount: 1000,
          isAnonymous: false,
          confirmedAt: "2026-11-04T00:00:00.000Z",
          category: "rent",
        },
        {
          donorId: "u1",
          amount: 500,
          isAnonymous: true,
          confirmedAt: "2026-11-05T00:00:00.000Z",
          category: "food",
        },
      ],
      now: new Date("2026-11-05T12:00:00.000Z"),
    });

    expect(board.entries.map((entry) => [entry.name, entry.totalGiven])).toEqual([
      ["Asha", 1000],
      ["Anonymous", 500],
    ]);
    expect(board.entries[1]?.id).toBe("anon:u1");
    expect(board.champions.find((row) => row.category === "food")?.name).toBe(
      "Anonymous",
    );
  });

  it("hides the whole rank when anonymous is the default", () => {
    const board = buildLeaderboard({
      donors: [{ ...donor, isAnonymousDefault: true }],
      payments: [
        {
          donorId: "u1",
          amount: 800,
          isAnonymous: false,
          confirmedAt: "2026-11-05T00:00:00.000Z",
          category: "medical",
        },
      ],
    });

    expect(board.entries[0]?.name).toBe("Anonymous");
    expect(board.entries[0]?.city).toBeNull();
    expect(board.champions[0]?.name).toBe("Anonymous");
  });
});

describe("haversine", () => {
  it("is near zero for the same point and about 10km for a small move", () => {
    expect(haversineKm({ lat: 18.52, lng: 73.85 }, { lat: 18.52, lng: 73.85 })).toBeLessThan(0.01);
    const km = haversineKm({ lat: 18.52, lng: 73.85 }, { lat: 18.61, lng: 73.85 });

    expect(km).toBeGreaterThan(9);
    expect(km).toBeLessThan(12);
  });
});
