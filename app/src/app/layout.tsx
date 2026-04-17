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
        url: `${SITE_URL}/api/pixabot/2156?size=960`,
        width: 960,
        height: 960,
        alt: "Pixabot 2156",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Pixabots — Pixel Character Avatars",
    description:
      "9,856 unique pixel art characters with deterministic IDs. Free API for avatars, animated GIFs, and more.",
    images: [`${SITE_URL}/api/pixabot/2156?size=480`],
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
