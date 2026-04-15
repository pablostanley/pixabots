import type { Metadata } from "next";
import { Pixelify_Sans } from "next/font/google";
import "./globals.css";

const pixelify = Pixelify_Sans({
  subsets: ["latin"],
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
    <html lang="en" className={`${pixelify.variable} dark`}>
      <body className="min-h-dvh flex flex-col font-[family-name:var(--font-pixel)]">
        {children}
      </body>
    </html>
  );
}
