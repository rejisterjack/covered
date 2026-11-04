import { BrandLockup } from "@/components/layout/brand-lockup";
import { PageHeader } from "@/components/layout/page-header";

export default function TermsPage() {
  return (
    <article>
      <PageHeader title="Terms" />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 text-[15px] leading-6 text-[#e7e9ea]">
        <BrandLockup className="text-[#71767b]" size="sm" />
        <p>
          Covered is a connection layer. We do not process, hold, escrow, or
          transfer money. Any payment happens directly between poster and donor
          outside this app.
        </p>
        <p>
          You are responsible for the accuracy of bills you post and for
          confirming receipt honestly. Community flagging may hide content.
          Repeated unconfirmed receipts may lock posting.
        </p>
        <p>
          Covered is not a charity, bank, payment processor, or lender. Covered
          is a product experience styled for X. Use of the service is at your
          own risk.
        </p>
      </div>
    </article>
  );
}
