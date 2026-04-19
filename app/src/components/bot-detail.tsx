import Link from "next/link";
import { resolveId } from "@pixabots/core";
import { PixelIcon } from "@/components/ui/pixel-icon";
import { FavoriteButton } from "@/components/favorite-button";
import { GalleryDialog } from "@/components/gallery-dialog";
import { PaletteShuffleButton } from "@/components/palette-shuffle-button";
import { BotIdCopy } from "@/components/bot-id-copy";
import { BotPasteNav } from "@/components/bot-paste-nav";
import { BotShareButton } from "@/components/bot-share-button";
import { PixelMaterialize } from "@/components/pixel-materialize";
import { specialNote } from "@/lib/special-ids";
import { withPalette } from "@/lib/palette";
import { COMBO_TOTAL, comboToIndex } from "@/lib/bot-nav";

type IconName = React.ComponentProps<typeof PixelIcon>["name"];

export function ActionButton({
  href,
  icon,
  label,
  download,
  external,
}: {
  href: string;
  icon: IconName;
  label: string;
  download?: string;
  external?: boolean;
}) {
  const className =
    "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-2 border border-border hover:bg-muted transition-colors text-sm";
  const content = (
    <>
      <PixelIcon name={icon} className="size-4" />
      {label}
    </>
  );
  if (download || external) {
    return (
      <a
        href={href}
        download={download}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={className}
      >
        {content}
      </a>
    );
  }
  return <Link href={href} className={className}>{content}</Link>;
}

export function BotDetail({
  id,
  hue,
  saturate,
}: {
  id: string;
  hue?: number;
  saturate?: number;
}) {
  const parts = resolveId(id);
  const note = specialNote(id);
  const index = comboToIndex(id);
  const editQs = new URLSearchParams({ id });
  if (hue && hue !== 0) editQs.set("hue", String(hue));
  if (saturate !== undefined && saturate !== 1) editQs.set("saturate", saturate.toFixed(2));

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <BotPasteNav id={id} />
      {/* aspect-square stops the container from collapsing between img
          swaps (prev/next nav), so nothing reflows below. */}
      <div className="relative aspect-square border border-border p-3">
        <picture>
          <source
            media="(prefers-reduced-motion: reduce)"
            srcSet={withPalette(`/api/pixabot/${id}?size=480`, { hue, saturate })}
          />
          <img
            src={withPalette(`/api/pixabot/${id}?size=480&animated=true`, { hue, saturate })}
            alt={`Pixabot ${id}`}
            width={480}
            height={480}
            decoding="async"
            fetchPriority="high"
            className="block w-full h-full"
            style={{ imageRendering: "pixelated" }}
          />
        </picture>
        <PixelMaterialize />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="mr-auto flex flex-col">
            <BotIdCopy id={id} />
            <span className="text-xs text-muted-foreground mt-1 font-mono">
              #{(index + 1).toLocaleString()} / {COMBO_TOTAL.toLocaleString()}
              {note && <span className="ml-2 font-sans">· {note}</span>}
            </span>
          </div>
          <FavoriteButton id={id} />
          <BotShareButton id={id} />
          <PaletteShuffleButton />
          <GalleryDialog id={id} />
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {(
            [
              ["face", "eyes", parts.eyes],
              ["heads", "heads", parts.heads],
              ["body", "body", parts.body],
              ["top", "top", parts.top],
            ] as const
          ).map(([label, cat, name]) => (
            <div key={cat} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd>
                <Link
                  href={`/browse?${cat}=${encodeURIComponent(name)}`}
                  className="hover:text-foreground hover:underline decoration-dotted underline-offset-2 transition-colors"
                  title={`Browse pixabots with ${cat}: ${name}`}
                >
                  {name}
                </Link>
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap gap-2 mt-2">
          <ActionButton href={`/?${editQs.toString()}`} icon="pen-square" label="Edit" />
          <ActionButton
            href={withPalette(`/api/pixabot/${id}?size=960`, { hue, saturate })}
            download={`pixabot-${id}.png`}
            icon="download"
            label="Get PNG"
          />
          <ActionButton
            href={withPalette(`/api/pixabot/${id}?animated=true&size=480`, { hue, saturate })}
            external
            icon="play"
            label="Get GIF"
          />
        </div>
      </div>
    </div>
  );
}
