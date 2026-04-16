import type { Metadata } from "next";
import { Pixelify_Sans } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Pixabots",
  description: "Pixel character creator and avatar API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pixelify.variable} dark`}>
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
