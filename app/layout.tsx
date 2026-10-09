import "@fontsource-variable/inter";
import "./globals.css";

import { GeistMono } from "geist/font/mono";
import type { Metadata, Viewport } from "next";

import { Providers } from "@/components/providers";
import { AppShell } from "@/components/shell/app-shell";
import { THEME_INIT_SCRIPT } from "@/components/theme";

const TITLE = "Livepeer Explorer";
const DESCRIPTION =
  "Track your Livepeer stake, rewards and fees across every wallet. Delegate to orchestrators and take part in governance.";

/**
 * Share images need absolute URLs. Without `SITE_URL`, Next builds them
 * from Vercel's system variables (`VERCEL_URL` and friends), and falls back
 * to localhost when a project doesn't expose those to the build.
 */
const SITE_URL = process.env.SITE_URL;

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: { default: TITLE, template: `%s · ${TITLE}` },
  description: DESCRIPTION,
  applicationName: TITLE,
  manifest: "/manifest.json",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: TITLE,
    type: "website",
  },
  // The image comes from app/opengraph-image.jpg; X falls back to it.
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={GeistMono.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
