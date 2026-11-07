import Link from "next/link";

import { PostBillForm } from "@/components/bills/post-bill-form";
import { RedeemInviteForm } from "@/components/invites/redeem-invite-form";
import { isPostingPaused } from "@/lib/admin";
import { canPostUnderSoftLaunch } from "@/lib/invites";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function NewBillPage() {
  const session = await getSession();

  if (!session?.user) {
    return (
      <div className="space-y-4 py-10 text-center">
        <h1 className="text-3xl text-[#e7e9ea]">Sign in to post</h1>
        <p className="text-sm text-[#71767b]">
          Email sign-in keeps the feed human.
        </p>
        <Link
          className="inline-flex rounded-full bg-[#1d9bf0] px-5 py-3 text-sm font-semibold text-white"
          href="/login"
        >
          Continue with email
        </Link>
      </div>
    );
  }

  if (await isPostingPaused()) {
    return (
      <div className="rounded-2xl border border-white/10 p-4 text-sm text-[#e7e9ea]">
        Posting is temporarily paused by the platform. Check back soon.
      </div>
    );
  }

  const gate = await canPostUnderSoftLaunch(session.user.id);

  if (!gate.allowed) {
    return <RedeemInviteForm />;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { city: true, postingLocked: true },
  });

  if (user?.postingLocked) {
    return (
      <div className="rounded-2xl bg-[#f4212e]/10 p-4 text-sm text-[#f4212e]">
        Posting is locked pending review because too many covers went
        unconfirmed.
      </div>
    );
  }

  return <PostBillForm defaultCity={user?.city} />;
}
