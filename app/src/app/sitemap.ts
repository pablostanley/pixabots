import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { SPECIAL_IDS } from "@/lib/special-ids";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entry = (url: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url,
    lastModified: now,
    changeFrequency: "monthly",
    priority,
  });

  const specialBots = Object.keys(SPECIAL_IDS).map((id) =>
    entry(`${SITE_URL}/bot/${id}`, 0.6)
  );

  return [
    entry(SITE_URL, 1),
    entry(`${SITE_URL}/browse`, 0.9),
    entry(`${SITE_URL}/favorites`, 0.6),
    entry(`${SITE_URL}/compare`, 0.5),
    entry(`${SITE_URL}/docs`, 0.8),
    entry(`${SITE_URL}/docs/api`, 0.7),
    entry(`${SITE_URL}/docs/sdk`, 0.7),
    entry(`${SITE_URL}/docs/usage`, 0.7),
    entry(`${SITE_URL}/docs/creator`, 0.7),
    entry(`${SITE_URL}/docs/shortcuts`, 0.6),
    entry(`${SITE_URL}/docs/parts`, 0.6),
    ...specialBots,
  ];
}
