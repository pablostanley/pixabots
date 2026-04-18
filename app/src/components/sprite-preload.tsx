import { parts, layerOrder } from "@/lib/parts";

export function SpritePreload() {
  return (
    <>
      {layerOrder.flatMap((cat) =>
        parts[cat].map((opt) => (
          <link key={opt.src} rel="preload" as="image" href={opt.src} />
        ))
      )}
    </>
  );
}
