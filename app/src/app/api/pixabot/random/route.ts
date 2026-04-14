import { type NextRequest } from "next/server";
import { randomId, decode, resolve } from "@pixabots/core";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");
  const id = randomId();

  if (format === "json") {
    const combo = decode(id);
    return Response.json(
      {
        id,
        combo,
        parts: resolve(combo),
        png: `${request.nextUrl.origin}/api/pixabot/${id}`,
      },
      { headers: CORS_HEADERS }
    );
  }

  // Redirect to the deterministic URL so the PNG gets cached
  const target = new URL(`/api/pixabot/${id}`, request.url);
  const size = request.nextUrl.searchParams.get("size");
  if (size) target.searchParams.set("size", size);
  return Response.redirect(target, 302);
}
