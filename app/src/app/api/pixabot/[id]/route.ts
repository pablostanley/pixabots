import { type NextRequest } from "next/server";
import { decode, isValidId, resolve } from "@pixabots/core";
import { renderPixabot, renderAnimatedPixabot, RenderError } from "@/lib/render";
import {
  CORS_HEADERS,
  optionsResponse,
  imageResponse,
  isValidSize,
  INVALID_SIZE_MESSAGE,
  DEFAULT_SIZE,
  MIN_SPEED,
  MAX_SPEED,
} from "@/lib/api";

export const OPTIONS = optionsResponse;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format");
  const sizeParam = request.nextUrl.searchParams.get("size");
  const size = sizeParam ? Number(sizeParam) : DEFAULT_SIZE;

  if (!isValidId(id)) {
    return Response.json(
      { error: "Invalid pixabot ID" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!isValidSize(size)) {
    return Response.json(
      { error: INVALID_SIZE_MESSAGE },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const combo = decode(id);
  const animated = request.nextUrl.searchParams.get("animated") === "true";
  const speedParam = request.nextUrl.searchParams.get("speed");
  let speed = 1;
  if (speedParam !== null) {
    const parsed = Number(speedParam);
    if (!Number.isFinite(parsed)) {
      return Response.json(
        { error: `Invalid speed. Must be a number between ${MIN_SPEED} and ${MAX_SPEED}.` },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    speed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, parsed));
  }

  if (format === "json") {
    const origin = request.nextUrl.origin;
    return Response.json(
      {
        id,
        combo,
        parts: resolve(combo),
        png: `${origin}/api/pixabot/${id}?size=${size}`,
        gif: `${origin}/api/pixabot/${id}?size=${size}&animated=true`,
      },
      { headers: CORS_HEADERS }
    );
  }

  try {
    if (animated) {
      const wantsWebp = request.nextUrl.searchParams.get("webp") === "true";
      const outFormat = wantsWebp ? "webp" : "gif";
      const buf = await renderAnimatedPixabot(combo, size, speed, outFormat);
      return imageResponse(buf, wantsWebp ? "image/webp" : "image/gif");
    }
    return imageResponse(await renderPixabot(combo, size), "image/png");
  } catch (e) {
    const status = e instanceof RenderError ? e.status : 500;
    const message = e instanceof RenderError ? e.message : "Render failed";
    return Response.json(
      { error: message },
      { status, headers: CORS_HEADERS }
    );
  }
}
