import type { ReadonlyURLSearchParams } from "next/navigation";

/**
 * Build a `/bot/{id}?…` href, carrying through any existing query string
 * (palette, etc.). Used by the intra-dialog edge arrows, the paste-to-jump
 * listener, and anywhere else that navigates to a bot without wanting to
 * drop the current URL state.
 */
export function botHref(id: string, searchParams?: ReadonlyURLSearchParams | null): string {
  const qs = searchParams?.toString();
  return qs ? `/bot/${id}?${qs}` : `/bot/${id}`;
}
