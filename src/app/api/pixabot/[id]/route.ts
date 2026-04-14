import { type NextRequest } from "next/server";
import { decode, isValidId, resolve } from "@pixabots/core";
import { renderPixabot } from "@/lib/render";

const VALID_SIZES = new Set([32, 64, 128, 240, 480, 960]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

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

  if (format === "json") {
    return Response.json(
      {
        id,
        combo,
        parts: resolve(combo),
        png: `${request.nextUrl.origin}/api/pixabot/${id}?size=${size}`,
      },
      { headers: CORS_HEADERS }
    );
  }

  const buffer = await renderPixabot(combo, size);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
      "CDN-Cache-Control": "public, max-age=31536000, immutable",
      ...CORS_HEADERS,
    },
  });
}
