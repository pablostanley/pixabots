import { forwardRef, type ImgHTMLAttributes } from "react";
import { isValidId, randomId } from "@pixabots/core";

const DEFAULT_ORIGIN = "https://pixabots.com";
const DEFAULT_SIZE = 128;

export type PixabotProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  /** 4-char base36 pixabot ID, or "random" to pick one on first render */
  id?: string | "random";
  /** Pixel size (any integer 32–1920). Default 128. */
  size?: number;
  /** Render the idle bounce animation as an animated image (default true). */
  animated?: boolean;
  /** Animation speed multiplier (0.25–4). Only applies when animated. */
  speed?: number;
  /** Return vector SVG instead of raster. */
  format?: "svg";
  /** Use animated WebP instead of GIF (smaller, alpha preserved). */
  webp?: boolean;
  /** Hue rotation in degrees (0–359). Applies to raster output. */
  hue?: number;
  /** Saturation multiplier (0 = greyscale, 1 = unchanged, up to 4). */
  saturate?: number;
  /** Background color as #rrggbb hex. Flattens transparency onto a solid fill. */
  bg?: string;
  /** Override the API origin (defaults to https://pixabots.com) */
  origin?: string;
};

function buildSrc(
  props: Required<Pick<PixabotProps, "id" | "size" | "animated" | "origin">> &
    Pick<PixabotProps, "speed" | "format" | "webp" | "hue" | "saturate" | "bg">
): string {
  const { id, size, animated, origin, speed, format, webp, hue, saturate, bg } = props;
  const params = new URLSearchParams();
  params.set("size", String(size));
  if (format === "svg") params.set("format", "svg");
  else if (animated) {
    params.set("animated", "true");
    if (webp) params.set("webp", "true");
    if (speed && speed !== 1) params.set("speed", String(speed));
  }
  if (hue && hue !== 0) params.set("hue", String(((Math.round(hue) % 360) + 360) % 360));
  if (saturate !== undefined && saturate !== 1) params.set("saturate", String(saturate));
  if (bg && /^#[0-9a-fA-F]{6}$/.test(bg)) params.set("bg", bg);
  return `${origin}/api/pixabot/${id}?${params.toString()}`;
}

/**
 * <Pixabot id="2156" /> — drop a pixabot anywhere.
 *
 * Pass any props you'd pass to an <img> (className, style, width, height, …).
 * `image-rendering: pixelated` is applied automatically so the pixel art
 * stays crisp; override via the `style` prop if needed.
 */
export const Pixabot = forwardRef<HTMLImageElement, PixabotProps>(function Pixabot(
  {
    id: idProp,
    size = DEFAULT_SIZE,
    animated = true,
    speed = 1,
    format,
    webp,
    hue,
    saturate,
    bg,
    origin = DEFAULT_ORIGIN,
    alt,
    style,
    width,
    height,
    ...rest
  },
  ref
) {
  const id = idProp && idProp !== "random" && isValidId(idProp) ? idProp : randomId();
  const src = buildSrc({ id, size, animated, origin, speed, format, webp, hue, saturate, bg });

  return (
    <img
      ref={ref}
      src={src}
      alt={alt ?? `Pixabot ${id}`}
      width={width ?? size}
      height={height ?? size}
      style={{ imageRendering: "pixelated", ...style }}
      {...rest}
    />
  );
});

export { isValidId, randomId } from "@pixabots/core";
