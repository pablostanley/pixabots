import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistPixel = localFont({
  src: "./fonts/GeistPixel-Square.woff2",
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "Pixabots",
  description: "Pixel character creator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistPixel.variable} dark`}>
      <body className="min-h-dvh flex flex-col font-[family-name:var(--font-pixel)]">
        {children}
      </body>
    </html>
  );
}
