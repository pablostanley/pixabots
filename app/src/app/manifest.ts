import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pixabots",
    short_name: "Pixabots",
    description:
      "9,856 unique pixel art characters with deterministic IDs. Free API for avatars and animated GIFs.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    orientation: "portrait",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "maskable" },
    ],
    categories: ["graphics", "utilities", "entertainment"],
  };
}
