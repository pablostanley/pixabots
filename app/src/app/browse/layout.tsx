import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

const OG = `${SITE_URL}/api/og?type=grid&title=${encodeURIComponent("Browse Pixabots")}&seed=browse`;

export const metadata: Metadata = {
  title: "Browse",
  description: "Explore 9,856 unique pixel art characters. Every pixabot has a unique 4-char ID.",
  openGraph: {
    title: "Browse Pixabots",
    description: "Explore 9,856 unique pixel art characters.",
    url: `${SITE_URL}/browse`,
    images: [{ url: OG, width: 1200, height: 630, alt: "Browse Pixabots" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Pixabots",
    description: "Explore 9,856 unique pixel art characters.",
    images: [{ url: OG, alt: "Browse Pixabots" }],
    site: "@pablostanley",
    creator: "@pablostanley",
  },
};

export default function BrowseLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
