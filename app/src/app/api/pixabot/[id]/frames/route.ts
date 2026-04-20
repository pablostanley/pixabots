import { type NextRequest } from "next/server";
import {
  ANIM_FRAMES,
  ANIM_VERSION,
  CATEGORY_ORDER,
  FRAME_MS,
  LAYER_ORDER,
  LOOP_LENGTH,
  decode,
  getPart,
  isValidId,
  resolve,
  resolveFrameIndex,
  type PartCategory,
} from "@pixabots/core";
import { CORS_HEADERS, optionsResponse } from "@/lib/api";

export const OPTIONS = optionsResponse;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidId(id)) {
    return Response.json(
      { error: "Invalid pixabot ID" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const combo = decode(id);
  const partByCategory = Object.fromEntries(
    CATEGORY_ORDER.map((cat) => [cat, getPart(cat, combo[cat])])
  ) as Record<PartCategory, ReturnType<typeof getPart>>;

  const origin = request.nextUrl.origin;

  const frames = Array.from({ length: LOOP_LENGTH }, (_, tick) => {
    const offsets = ANIM_FRAMES[tick % ANIM_FRAMES.length];
    const spriteIndex = Object.fromEntries(
      LAYER_ORDER.map((cat) => [cat, resolveFrameIndex(partByCategory[cat], tick)])
    ) as Record<PartCategory, number>;
    return { tick, offsets, spriteIndex };
  });

  const sprites = Object.fromEntries(
    LAYER_ORDER.map((cat) => {
      const part = partByCategory[cat];
      return [
        cat,
        {
          url: `${origin}/parts/${part.path}`,
          frames: part.frames ?? 1,
          kind: part.kind ?? "static",
        },
      ];
    })
  );

  return Response.json(
    {
      id,
      combo,
      parts: resolve(combo),
      animVersion: ANIM_VERSION,
      frameMs: FRAME_MS,
      loopLength: LOOP_LENGTH,
      layerOrder: LAYER_ORDER,
      nativeSize: 32,
      frames,
      sprites,
    },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
