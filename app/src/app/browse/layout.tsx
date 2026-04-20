import type { Metadata } from "next";
import { SITE_URL, TOTAL_COMBOS_LABEL } from "@/lib/constants";

const OG = `${SITE_URL}/api/og?type=grid&title=${encodeURIComponent("Browse Pixabots")}&seed=browse`;
const SHORT = `Explore ${TOTAL_COMBOS_LABEL} unique pixel art characters.`;

export const metadata: Metadata = {
  title: "Browse",
  description: `${SHORT} Every pixabot has a unique 4-char ID.`,
  openGraph: {
    title: "Browse Pixabots",
    description: SHORT,
    url: `${SITE_URL}/browse`,
    images: [{ url: OG, width: 1200, height: 630, alt: "Browse Pixabots" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Pixabots",
    description: SHORT,
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
