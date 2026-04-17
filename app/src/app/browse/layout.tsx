import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Browse",
  description: "Explore 9,856 unique pixel art characters. Every pixabot has a unique 4-char ID.",
  openGraph: {
    title: "Browse Pixabots",
    description: "Explore 9,856 unique pixel art characters.",
    url: `${SITE_URL}/browse`,
    images: [`${SITE_URL}/api/pixabot/2156?size=960`],
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
