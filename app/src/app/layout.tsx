import type { Metadata } from "next";
import { Pixelify_Sans } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShortcutsOverlay } from "@/components/shortcuts-overlay";
import { CommandPalette } from "@/components/command-palette";
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
    images: [
      {
        url: `${SITE_URL}/api/og?type=grid&title=Pixabots&seed=home`,
        alt: "Pixabots",
      },
    ],
    site: "@pablostanley",
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

const THEME_SCRIPT = `
(function() {
  try {
    var pref = localStorage.getItem('theme');
    var dark = pref ? pref === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

const SW_SCRIPT = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  });
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={pixelify.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SW_SCRIPT }} />
      </head>
      <body className="min-h-dvh flex flex-col font-[family-name:var(--font-pixel)]">
        <RootProvider>
          <SiteHeader />
          <div className="flex-1 flex flex-col">{children}</div>
          <SiteFooter />
          <ShortcutsOverlay />
          <CommandPalette />
        </RootProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
