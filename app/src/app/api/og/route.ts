import { type NextRequest } from "next/server";
import { isValidId } from "@pixabots/core";
import { generateOgImage } from "@/lib/og-image";
import { CORS_HEADERS, optionsResponse, imageResponse } from "@/lib/api";

export const OPTIONS = optionsResponse;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type") ?? "grid";
  const title = params.get("title") ?? "Pixabots";
  const subtitle = params.get("subtitle") ?? undefined;

  try {
    if (type === "single") {
      const id = params.get("id");
      if (!id || !isValidId(id)) {
        return Response.json(
          { error: "Missing or invalid id" },
          { status: 400, headers: CORS_HEADERS }
        );
      }
      const buffer = await generateOgImage({ type: "single", id, title, subtitle });
      return imageResponse(buffer, "image/png");
    }

    if (type !== "grid") {
      return Response.json(
        { error: "type must be 'grid' or 'single'" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const seed = params.get("seed") ?? title;
    const buffer = await generateOgImage({ type: "grid", title, subtitle, seed });
    return imageResponse(buffer, "image/png");
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "OG render failed" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
