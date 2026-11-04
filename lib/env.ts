import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  EMAIL_DEV_MODE: z.string().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  NEXT_PUBLIC_R2_PUBLIC_URL: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  FLAG_AUTO_THRESHOLD: z.string().optional(),
  POSTING_LOCK_UNCONFIRMED_THRESHOLD: z.string().optional(),
  CONFIRMATION_WINDOW_HOURS: z.string().optional(),
});

export const env = {
  ...serverSchema.parse(process.env),
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000",
  emailDevMode:
    process.env.EMAIL_DEV_MODE === "true" || !process.env.RESEND_API_KEY,
  flagAutoThreshold: Number(process.env.FLAG_AUTO_THRESHOLD ?? "3"),
  postingLockThreshold: Number(
    process.env.POSTING_LOCK_UNCONFIRMED_THRESHOLD ?? "3",
  ),
  confirmationWindowHours: Number(
    process.env.CONFIRMATION_WINDOW_HOURS ?? "24",
  ),
  r2PublicUrl:
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ??
    "https://assets.covered.rejisterjack.com",
};
