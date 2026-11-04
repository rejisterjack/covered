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
    template: `%s / X`,
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
    siteName: "Covered from X",
    type: "website",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
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
