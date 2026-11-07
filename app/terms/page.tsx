import { BrandLockup } from "@/components/layout/brand-lockup";
import { PageHeader } from "@/components/layout/page-header";
import { siteConfig } from "@/config/site";

export default function TermsPage() {
  return (
    <article>
      <PageHeader title="Terms of use" />
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 text-[15px] leading-6 text-[#e7e9ea]">
        <BrandLockup className="text-[#71767b]" size="sm" />
        <p className="text-[13px] text-[#71767b]">
          Last updated for soft launch review. This page needs human legal
          sign-off before treating it as final.
        </p>

        <section className="space-y-3">
          <h2 className="text-[17px] font-bold">What Covered is</h2>
          <p>
            Covered is a peer-to-peer connection layer for posting real bills
            and finding someone willing to cover them. It is a product
            experience — not a bank, payment processor, escrow service, charity,
            lender, or money transmitter.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[17px] font-bold">Money boundary</h2>
          <p>
            Covered never processes, holds, escrows, routes, or transfers money.
            We never collect fees on covers. Any payment happens directly between
            poster and donor outside this app (for example UPI, Venmo, PayPal, or
            cash). Payment handles and QR images on a bill are contact details
            for that off-app payment — not instructions for Covered to move
            funds.
          </p>
          <p>
            Covered does not verify that a payment cleared. Confirmation flows
            are trust signals between users, not settlement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[17px] font-bold">Your responsibilities</h2>
          <p>
            You are responsible for the accuracy of bills you post (biller,
            reference, amount, due date, and payee handle) and for confirming
            receipt honestly. Community flagging may hide content. Repeated
            unconfirmed receipts may lock posting. Do not post fraudulent bills,
            spam, harassment, or someone else&apos;s payment details without
            permission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[17px] font-bold">Accounts and access</h2>
          <p>
            Soft launch may require an invite code to post. Admins may pause
            posting, soft-delete bills, lock accounts, or remove content that
            violates these terms. Use of the service is at your own risk.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-[17px] font-bold">Contact</h2>
          <p>
            Questions about these terms: contact the operator of{" "}
            <a
              className="text-[#1d9bf0] hover:underline"
              href={siteConfig.url}
            >
              {siteConfig.url.replace(/^https?:\/\//, "")}
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
