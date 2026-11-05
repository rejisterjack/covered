import { Resend } from "resend";

import { siteConfig } from "@/config/site";
import { env } from "@/lib/env";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (env.emailDevMode) {
    // eslint-disable-next-line no-console -- intentional local email delivery
    console.info(
      `[EMAIL_DEV_MODE] to=${input.to} subject=${input.subject}\n${input.text}`,
    );

    return { id: "dev-mode" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "Covered <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

export async function sendMagicLinkEmail(input: {
  email: string;
  url: string;
}) {
  await sendEmail({
    to: input.email,
    subject: "Sign in to Covered",
    text: `Sign in to Covered with this link:\n\n${input.url}\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;line-height:1.5;color:#e7e9ea;background:#000;padding:32px 20px;">
        <div style="max-width:420px;margin:0 auto;">
          <img src="${siteConfig.url}/icons/icon-192.png" width="56" height="56" alt="Covered" style="display:block;border-radius:14px;border:1px solid #2f3336;" />
          <h1 style="margin:20px 0 8px;font-size:24px;font-weight:800;color:#e7e9ea;">Covered</h1>
          <p style="margin:0 0 20px;color:#71767b;">Click the button below to sign in. This link expires soon.</p>
          <p style="margin:0 0 20px;">
            <a href="${input.url}" style="display:inline-block;background:#1d9bf0;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700;">
              Sign in to Covered
            </a>
          </p>
          <p style="margin:0;color:#71767b;font-size:13px;">Or paste this URL into your browser:<br/><span style="word-break:break-all;color:#e7e9ea;">${input.url}</span></p>
        </div>
      </div>
    `,
  });
}
