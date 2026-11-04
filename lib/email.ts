import { Resend } from "resend";

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
      <div style="font-family: sans-serif; line-height: 1.5; color: #0b1210;">
        <h1 style="color: #059669;">Covered</h1>
        <p>Click the button below to sign in. This link expires soon.</p>
        <p>
          <a href="${input.url}" style="display:inline-block;background:#34d399;color:#022c22;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600;">
            Sign in to Covered
          </a>
        </p>
        <p style="color:#6b7280;font-size:14px;">Or paste this URL into your browser:<br/>${input.url}</p>
      </div>
    `,
  });
}
