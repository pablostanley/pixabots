import { type NextRequest } from "next/server";
import { randomId, decode, resolve } from "@pixabots/core";
import { CORS_HEADERS, optionsResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

export const OPTIONS = optionsResponse;

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");
  const id = randomId();

  if (format === "json") {
    const origin = request.nextUrl.origin;
    const combo = decode(id);
    return Response.json(
      {
        id,
        combo,
        parts: resolve(combo),
        png: `${origin}/api/pixabot/${id}`,
        gif: `${origin}/api/pixabot/${id}?animated=true`,
      },
      { headers: CORS_HEADERS }
    );
  }

  const target = new URL(`/api/pixabot/${id}`, request.url);
  const size = request.nextUrl.searchParams.get("size");
  if (size) target.searchParams.set("size", size);
  return Response.redirect(target, 302);
}
