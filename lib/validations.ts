import { BillCategory, FlagReason, PaymentType } from "@prisma/client";
import { z } from "zod";

import {
  isAmountAllowed,
  isDueDateInWindow,
  isValidPayeeHandle,
  maxBillAmountInr,
} from "@/lib/bill-rules";

const mediaUrl = z
  .string()
  .min(1)
  .refine(
    (value) =>
      value.startsWith("https://") ||
      value.startsWith("http://") ||
      value.startsWith("data:image/"),
    "Invalid image URL",
  );

export const createBillSchema = z
  .object({
    amount: z.number().positive().max(maxBillAmountInr()),
    category: z.nativeEnum(BillCategory),
    billerName: z.string().trim().min(2).max(120),
    referenceNo: z.string().trim().min(2).max(80),
    dueDate: z.string().min(8).max(32),
    story: z.string().trim().max(280).optional().nullable(),
    imageUrl: mediaUrl,
    paymentHandle: z.string().trim().min(3).max(120),
    paymentType: z.nativeEnum(PaymentType),
    paymentQrUrl: mediaUrl.optional().nullable(),
    locationCity: z.string().trim().min(2).max(80).optional().nullable(),
    latitude: z.number().gte(-90).lte(90).optional().nullable(),
    longitude: z.number().gte(-180).lte(180).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!isAmountAllowed(data.amount)) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: `Amount must be at most ₹${maxBillAmountInr()}`,
      });
    }

    const due = new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(data.dueDate)
        ? `${data.dueDate}T12:00:00`
        : data.dueDate,
    );

    if (Number.isNaN(due.getTime()) || !isDueDateInWindow(due)) {
      ctx.addIssue({
        code: "custom",
        path: ["dueDate"],
        message: "Due date must be within 180 days past or ahead",
      });
    }

    if (!isValidPayeeHandle(data.paymentHandle, data.paymentType)) {
      ctx.addIssue({
        code: "custom",
        path: ["paymentHandle"],
        message:
          data.paymentType === "upi"
            ? "Payee UPI must look like name@bank"
            : "Payee handle is invalid",
      });
    }
  });

export const markPaidSchema = z.object({
  isAnonymous: z.boolean().optional(),
  screenshotUrl: mediaUrl,
});

export const flagSchema = z.object({
  reason: z.nativeEnum(FlagReason),
});

export const presignSchema = z.object({
  contentType: z.string().min(3),
  contentLength: z.number().int().positive(),
  purpose: z.enum(["bill", "qr", "screenshot", "avatar"]).default("bill"),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  city: z.string().trim().min(2).max(80).optional().nullable(),
  isAnonymousDefault: z.boolean().optional(),
  verificationRequest: z.literal(true).optional(),
});

export const feedQuerySchema = z.object({
  tab: z.enum(["new", "hot", "covered"]).default("new"),
  category: z.nativeEnum(BillCategory).optional(),
  cursor: z.string().optional(),
  lat: z.coerce.number().gte(-90).lte(90).optional(),
  lng: z.coerce.number().gte(-180).lte(180).optional(),
  radiusKm: z.coerce.number().min(1).max(200).optional(),
});
