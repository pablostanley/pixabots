import { type NextRequest } from "next/server";
import { decode, isValidId, resolve } from "@pixabots/core";
import { renderPixabot, renderAnimatedPixabot } from "@/lib/render";
import { CORS_HEADERS, optionsResponse, imageResponse } from "@/lib/api";

const VALID_SIZES = new Set([32, 64, 128, 240, 480, 960]);

export const OPTIONS = optionsResponse;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format");
  const sizeParam = request.nextUrl.searchParams.get("size");
  const size = sizeParam ? parseInt(sizeParam, 10) : 128;

  if (!isValidId(id)) {
    return Response.json(
      { error: "Invalid pixabot ID" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!VALID_SIZES.has(size)) {
    return Response.json(
      { error: `Invalid size. Valid: ${[...VALID_SIZES].join(", ")}` },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const combo = decode(id);
  const animated = request.nextUrl.searchParams.get("animated") === "true";

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

  if (animated) {
    return imageResponse(await renderAnimatedPixabot(combo, size), "image/gif");
  }

  return imageResponse(await renderPixabot(combo, size), "image/png");
}
