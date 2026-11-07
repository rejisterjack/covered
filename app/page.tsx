import Link from "next/link";

import { CoveredMark } from "@/components/brand/covered-mark";
import { InstallButton } from "@/components/pwa/install-button";
import { siteConfig } from "@/config/site";

const STEPS = [
  {
    title: "Post a real bill",
    body: "Upload the invoice, add biller, reference, amount, and due date. One active bill at a time.",
  },
  {
    title: "Someone covers it",
    body: "A donor taps Cover, pays the bill’s payee directly, and uploads proof. Covered never holds the money.",
  },
  {
    title: "Confirm and climb",
    body: "You confirm receipt. They rise on the public leaderboard. Generosity becomes visible.",
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="mx-auto flex w-full max-w-5xl flex-col items-start gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="flex items-center gap-3">
          <CoveredMark
            className="shadow-[0_0_0_1px_#2f3336]"
            size={56}
          />
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#1d9bf0]">
            Covered
          </p>
        </div>
        <div className="max-w-3xl space-y-4">
          <h1 className="text-[40px] font-extrabold leading-[1.05] tracking-tight text-[#e7e9ea] sm:text-[56px]">
            Post your bill.
            <br />
            Someone&apos;s got it.
          </h1>
          <p className="max-w-xl text-[17px] leading-7 text-[#71767b] sm:text-[19px]">
            {siteConfig.tagline} Peer-to-peer bill covering — medical, rent,
            utilities, and more. Pay outside the app. Climb the leaderboard.
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:items-start">
          <InstallButton className="sm:min-w-[200px]" />
          <Link
            className="x-btn x-btn-outline min-h-12 px-6 text-[16px]"
            href="/app"
          >
            Open the app
          </Link>
        </div>
      </section>

      <section className="border-y border-[#2f3336] bg-[#080808]">
        <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6 sm:py-16">
          {STEPS.map((step, index) => (
            <div key={step.title} className="space-y-3">
              <p className="text-[13px] font-bold text-[#1d9bf0]">
                Step {index + 1}
              </p>
              <h2 className="text-[20px] font-extrabold tracking-tight text-[#e7e9ea]">
                {step.title}
              </h2>
              <p className="text-[15px] leading-6 text-[#71767b]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="rounded-3xl border border-[#2f3336] bg-[#080808] px-5 py-8 sm:px-8 sm:py-10">
          <h2 className="text-[24px] font-extrabold tracking-tight sm:text-[28px]">
            Covered never touches the money
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[#71767b] sm:text-[16px]">
            Donors pay the poster&apos;s bill payee directly — UPI, Venmo,
            PayPal, or cash. Covered only connects people and keeps a public
            leaderboard of confirmed covers.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link className="x-btn x-btn-primary" href="/install">
              Get the app
            </Link>
            <Link className="x-btn x-btn-outline" href="/leaderboard">
              View leaderboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
