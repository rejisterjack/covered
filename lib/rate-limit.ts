import { prisma } from "@/lib/prisma";

type Bucket = { count: number; resetAt: number };

const memory = new Map<string, Bucket>();

function rateLimitMemory(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = memory.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;

    memory.set(key, { count: 1, resetAt });

    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  memory.set(key, existing);

  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/** Shared across server instances via Postgres. Falls back to memory if the table is unavailable. */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowMs);

  try {
    const existing = await prisma.rateLimitBucket.findUnique({ where: { key } });

    if (!existing || existing.resetAt <= now) {
      await prisma.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt: nextReset },
        update: { count: 1, resetAt: nextReset },
      });

      return {
        ok: true,
        remaining: limit - 1,
        resetAt: nextReset.getTime(),
      };
    }

    if (existing.count >= limit) {
      return {
        ok: false,
        remaining: 0,
        resetAt: existing.resetAt.getTime(),
      };
    }

    const updated = await prisma.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    if (Math.random() < 0.02) {
      await prisma.rateLimitBucket.deleteMany({
        where: { resetAt: { lt: now } },
      });
    }

    return {
      ok: updated.count <= limit,
      remaining: Math.max(0, limit - updated.count),
      resetAt: updated.resetAt.getTime(),
    };
  } catch {
    return rateLimitMemory(key, limit, windowMs);
  }
}

export function clientKey(request: Request, suffix: string) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  return `${ip}:${suffix}`;
}
