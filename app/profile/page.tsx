import Link from "next/link";

import { ProfileForm } from "@/components/auth/profile-form";
import { getDonorStreak } from "@/lib/leaderboard";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-14 text-center">
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#e7e9ea] sm:text-[28px]">
          Your profile
        </h1>
        <p className="text-[15px] text-[#71767b]">
          Sign in to manage your name, city, and payment defaults.
        </p>
        <Link className="x-btn x-btn-primary inline-flex" href="/login">
          Sign in
        </Link>
      </div>
    );
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });
  const streak = await getDonorStreak(user.id);

  return (
    <ProfileForm
      initial={{
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        isAnonymousDefault: user.isAnonymousDefault,
        isVerifiedPublic: user.isVerifiedPublic,
        verificationRequestedAt:
          user.verificationRequestedAt?.toISOString() ?? null,
        postingLocked: user.postingLocked,
        totalGiven: Number(user.totalGiven),
        billsCovered: user.billsCovered,
        billsPosted: user.billsPosted,
        streak: streak.streak,
        badge: streak.badge,
      }}
    />
  );
}
