import Link from "next/link";
import { resolveId } from "@pixabots/core";
import { PixelIcon } from "@/components/ui/pixel-icon";

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

export function BotDetail({ id }: { id: string }) {
  const parts = resolveId(id);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="border border-border p-3">
        <img
          src={`/api/pixabot/${id}?size=480&animated=true`}
          alt={`Pixabot ${id}`}
          width={480}
          height={480}
          className="block w-full h-auto"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-bold font-mono">{id}</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">face</dt>
          <dd>{parts.eyes}</dd>
          <dt className="text-muted-foreground">heads</dt>
          <dd>{parts.heads}</dd>
          <dt className="text-muted-foreground">body</dt>
          <dd>{parts.body}</dd>
          <dt className="text-muted-foreground">top</dt>
          <dd>{parts.top}</dd>
        </dl>

        <div className="flex flex-wrap gap-2 mt-2">
          <ActionButton href={`/?id=${id}`} icon="pen-square" label="Edit" />
          <ActionButton
            href={`/api/pixabot/${id}?size=960`}
            download={`pixabot-${id}.png`}
            icon="download"
            label="Get PNG"
          />
          <ActionButton
            href={`/api/pixabot/${id}?animated=true&size=480`}
            external
            icon="play"
            label="Get GIF"
          />
        </div>
      </div>
    </div>
  );
}
