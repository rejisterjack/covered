import "@/styles/globals.css";
import { Metadata, Viewport } from "next";

import { Providers } from "./providers";

import { AppShell } from "@/components/layout/app-shell";
import { RegisterSW } from "@/components/pwa/register-sw";
import { siteConfig } from "@/config/site";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: {
    default: siteConfig.fullName,
    template: `%s · Covered`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.fullName,
  metadataBase: new URL(siteConfig.url),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Covered",
  },
  openGraph: {
    title: siteConfig.fullName,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: "Covered",
    type: "website",
    images: [
      {
        url: "/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Covered",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteConfig.fullName,
    description: siteConfig.description,
    images: ["/icons/icon-512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const initialUser = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
      }
    : null;

  return (
    <html suppressHydrationWarning className="dark" lang="en">
      <body className="min-h-screen bg-black font-sans text-[#e7e9ea] antialiased">
        <Providers
          themeProps={{
            attribute: "class",
            defaultTheme: "dark",
            forcedTheme: "dark",
          }}
        >
          <AppShell initialUser={initialUser}>{children}</AppShell>
          <RegisterSW />
        </Providers>
      </body>
    </html>
  );
}
