import { BrandLockup } from "@/components/layout/brand-lockup";
import { PageHeader } from "@/components/layout/page-header";
import { siteConfig } from "@/config/site";

export default function PrivacyPage() {
  return (
    <article>
      <PageHeader title="Privacy" />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 text-[15px] leading-6 text-[#e7e9ea]">
        <BrandLockup className="text-[#71767b]" size="sm" />
        <p className="text-[13px] text-[#71767b]">
          Last updated for soft launch review. This page needs human legal
          sign-off before treating it as final.
        </p>

        <section className="space-y-3">
          <h2 className="text-[17px] font-bold">Money boundary</h2>
          <p>
            Covered does not process payments. We do not store card numbers,
            bank passwords, or payment-provider credentials. Payee handles and
            optional QR images you attach to a bill are shown so another person
            can pay you directly outside Covered.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[17px] font-bold">Data we store</h2>
          <ul className="list-disc space-y-2 pl-5 text-[#e7e9ea]">
            <li>
              Account: email (for magic-link auth), display name, optional city /
              phone / avatar, verification and role flags.
            </li>
            <li>
              Bills: amount, category, biller name, reference, due date, optional
              note, bill photo URL, payee handle / type / optional QR, optional
              location, status, and cover / view counters.
            </li>
            <li>
              Cover activity: cover intents, payment screenshots you upload after
              paying, confirmation timestamps, anonymous preference, leaderboard
              totals derived from confirmed covers.
            </li>
            <li>
              Moderation: flags, admin audit logs, soft-delete timestamps,
              posting locks, platform settings, optional invite codes.
            </li>
            <li>
              Notifications: Web Push subscription endpoints if you enable
              push.
            </li>
            <li>
              Operational: session cookies, rate-limit buckets, and upload
              object keys in Cloudflare R2.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-[17px] font-bold">How we use and show it</h2>
          <p>
            Feed cards show first name and city only — not full payment details.
            Payment handles and QR images appear to donors after they tap Cover,
            and to the bill poster. We use Resend to deliver magic-link email
            and R2 to host images you upload. We do not sell personal data.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[17px] font-bold">Retention and deletion</h2>
          <p>
            Soft-deleted bills are hidden from public feeds but retained for
            abuse review. To request account or data deletion, contact the
            operator of{" "}
            <a
              className="text-[#1d9bf0] hover:underline"
              href={siteConfig.url}
            >
              {siteConfig.url.replace(/^https?:\/\//, "")}
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[17px] font-bold">Contact</h2>
          <p>
            Privacy requests and questions go to the deployment owner at the
            domain above. Soft-launch operators should respond via the email
            used for Covered ops / Resend from-address.
          </p>
        </section>
      </div>
    </article>
  );
}
