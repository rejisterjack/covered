import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";

import { isAdminEmail, promoteAdminIfAllowlisted } from "@/lib/admin-allowlist";
import { sendMagicLinkEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  user: {
    additionalFields: {
      city: {
        type: "string",
        required: false,
        input: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      isVerifiedPublic: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      isAnonymousDefault: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: true,
      },
      postingLocked: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      // totals stay on User in Prisma only — Decimal values break Better Auth session cloning
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (isAdminEmail(user.email)) {
            await promoteAdminIfAllowlisted(user.id, user.email);
          }
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { id: true, email: true, role: true },
          });

          if (user && user.role !== "admin" && isAdminEmail(user.email)) {
            await promoteAdminIfAllowlisted(user.id, user.email);
          }
        },
      },
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ email, url });
      },
      expiresIn: 60 * 10,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
