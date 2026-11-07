export type PaymentFact = {
  donorId: string;
  amount: number;
  isAnonymous: boolean;
  confirmedAt: string;
  category: string;
};

export type DonorProfile = {
  id: string;
  name: string;
  city: string | null;
  image: string | null;
  isVerifiedPublic: boolean;
  isAnonymousDefault: boolean;
};

export type RankEntry = {
  rank: number;
  id: string;
  donorId: string;
  name: string;
  city: string | null;
  image: string | null;
  isVerifiedPublic: boolean;
  anonymous: boolean;
  totalGiven: number;
  billsCovered: number;
  streak: number;
  badge: 7 | 14 | 30 | null;
};

export type CategoryChampion = {
  category: string;
  donorId: string;
  name: string;
  anonymous: boolean;
  totalGiven: number;
  billsCovered: number;
  isVerifiedPublic: boolean;
};

export function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function shiftDay(day: string, delta: number) {
  const date = new Date(`${day}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + delta);

  return date.toISOString().slice(0, 10);
}

/** Consecutive confirmed-cover days ending today, or yesterday if today is still open. */
export function currentStreak(confirmedDays: string[], now = new Date()) {
  const days = new Set(confirmedDays);
  let cursor = dayKey(now);

  if (!days.has(cursor)) {
    cursor = shiftDay(cursor, -1);
    if (!days.has(cursor)) return 0;
  }

  let streak = 0;

  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftDay(cursor, -1);
  }

  return streak;
}

export function streakBadge(streak: number): 7 | 14 | 30 | null {
  if (streak >= 30) return 30;
  if (streak >= 14) return 14;
  if (streak >= 7) return 7;

  return null;
}

export function publicFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Someone";
}

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

type Bucket = {
  key: string;
  donorId: string;
  anonymous: boolean;
  amount: number;
  count: number;
  byCategory: Map<string, { amount: number; count: number }>;
};

function bucketKey(donorId: string, anonymous: boolean) {
  return anonymous ? `anon:${donorId}` : donorId;
}

export function buildLeaderboard(input: {
  payments: PaymentFact[];
  donors: DonorProfile[];
  now?: Date;
}) {
  const donors = new Map(input.donors.map((donor) => [donor.id, donor]));
  const daysByDonor = new Map<string, Set<string>>();
  const buckets = new Map<string, Bucket>();

  for (const payment of input.payments) {
    const donor = donors.get(payment.donorId);

    if (!donor || !payment.confirmedAt) continue;

    const days = daysByDonor.get(payment.donorId) ?? new Set<string>();

    days.add(dayKey(new Date(payment.confirmedAt)));
    daysByDonor.set(payment.donorId, days);

    if (payment.amount <= 0) continue;

    const anonymous = donor.isAnonymousDefault || payment.isAnonymous;
    const key = bucketKey(payment.donorId, anonymous);
    const bucket = buckets.get(key) ?? {
      key,
      donorId: payment.donorId,
      anonymous,
      amount: 0,
      count: 0,
      byCategory: new Map(),
    };

    bucket.amount += payment.amount;
    bucket.count += 1;
    const category = bucket.byCategory.get(payment.category) ?? {
      amount: 0,
      count: 0,
    };

    category.amount += payment.amount;
    category.count += 1;
    bucket.byCategory.set(payment.category, category);
    buckets.set(key, bucket);
  }

  const streaks = new Map<string, number>();

  for (const [donorId, days] of Array.from(daysByDonor.entries())) {
    streaks.set(donorId, currentStreak(Array.from(days), input.now));
  }

  const entries: RankEntry[] = Array.from(buckets.values())
    .filter((bucket) => bucket.amount > 0)
    .sort((a, b) => b.amount - a.amount || b.count - a.count)
    .slice(0, 50)
    .map((bucket, index) => {
      const donor = donors.get(bucket.donorId)!;
      const streak = streaks.get(bucket.donorId) ?? 0;

      return {
        rank: index + 1,
        id: bucket.key,
        donorId: bucket.donorId,
        name: bucket.anonymous ? "Anonymous" : publicFirstName(donor.name),
        city: bucket.anonymous ? null : donor.city,
        image: bucket.anonymous ? null : donor.image,
        isVerifiedPublic: bucket.anonymous ? false : donor.isVerifiedPublic,
        anonymous: bucket.anonymous,
        totalGiven: Math.round(bucket.amount),
        billsCovered: bucket.count,
        streak,
        badge: streakBadge(streak),
      };
    });

  const champions: CategoryChampion[] = [];

  const categories = new Set<string>();

  for (const bucket of Array.from(buckets.values())) {
    for (const category of Array.from(bucket.byCategory.keys())) {
      categories.add(category);
    }
  }

  for (const category of Array.from(categories).sort()) {
    let best: { bucket: Bucket; amount: number; count: number } | null = null;

    for (const bucket of Array.from(buckets.values())) {
      const stats = bucket.byCategory.get(category);

      if (!stats) continue;
      if (
        !best ||
        stats.amount > best.amount ||
        (stats.amount === best.amount && stats.count > best.count)
      ) {
        best = { bucket, amount: stats.amount, count: stats.count };
      }
    }

    if (!best) continue;

    const donor = donors.get(best.bucket.donorId);

    if (!donor) continue;

    champions.push({
      category,
      donorId: best.bucket.donorId,
      name: best.bucket.anonymous ? "Anonymous" : publicFirstName(donor.name),
      anonymous: best.bucket.anonymous,
      totalGiven: Math.round(best.amount),
      billsCovered: best.count,
      isVerifiedPublic: best.bucket.anonymous ? false : donor.isVerifiedPublic,
    });
  }

  return { entries, champions };
}
