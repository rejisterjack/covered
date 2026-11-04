import { BrandLockup } from "@/components/layout/brand-lockup";
import { PageHeader } from "@/components/layout/page-header";

export default function PrivacyPage() {
  return (
    <article>
      <PageHeader title="Privacy" />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 text-[15px] leading-6 text-[#e7e9ea]">
        <BrandLockup className="text-[#71767b]" size="sm" />
        <p>
          We store your email for authentication, profile fields you provide,
          bills you post, and cover activity needed for leaderboards and trust
          flows.
        </p>
        <p>
          Payment handles and QR images appear only on bills you publish, and
          are revealed to donors after they tap Cover. Feed cards show first
          name and city only.
        </p>
        <p>
          Push subscription endpoints are stored if you enable notifications. We
          do not sell personal data. Contact ops via your deployment domain
          owner to request deletion.
        </p>
      </div>
    </article>
  );
}
