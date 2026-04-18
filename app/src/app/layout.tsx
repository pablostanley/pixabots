import type { Metadata } from "next";
import { Pixelify_Sans } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: {
    default: "Pixabots — Pixel Character Avatars",
    template: "%s — Pixabots",
  },
  description:
    "9,856 unique pixel art characters with deterministic IDs. Free API for avatars, animated GIFs, and more.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: "Pixabots",
    title: "Pixabots — Pixel Character Avatars",
    description:
      "9,856 unique pixel art characters with deterministic IDs. Free API for avatars, animated GIFs, and more.",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/api/og?type=grid&title=Pixabots&seed=home`,
        width: 1200,
        height: 630,
        alt: "Pixabots",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixabots — Pixel Character Avatars",
    description:
      "9,856 unique pixel art characters with deterministic IDs. Free API for avatars, animated GIFs, and more.",
    images: [`${SITE_URL}/api/og?type=grid&title=Pixabots&seed=home`],
    creator: "@pablostanley",
  },
  keywords: [
    "pixel art",
    "avatar",
    "character generator",
    "API",
    "pixabots",
    "pixel",
    "retro",
    "8-bit",
  ],
  authors: [{ name: "Pablo Stanley", url: "https://x.com/pablostanley" }],
  creator: "Pablo Stanley",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={pixelify.variable} suppressHydrationWarning>
      <body className="min-h-dvh flex flex-col font-[family-name:var(--font-pixel)]">
        <RootProvider>
          <SiteHeader />
          <div className="flex-1 flex flex-col">{children}</div>
          <SiteFooter />
        </RootProvider>
      </body>
    </html>
  );
}
