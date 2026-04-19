/**
 * Shared motion tokens. Centralising these keeps the site feeling like
 * one instrument — every "pop" uses the same scale + duration + curve.
 * See ROADMAP "Design principles" for the Emil Kowalski framework.
 */

/**
 * Small icon swap pop: scale up from 95% + fade in, 150ms ease-out.
 * Used for the check-mark appearing after copy/share, the favorite
 * star, and any other feedback icon that flips state.
 */
export const POP_IN =
  "animate-in zoom-in-95 fade-in-0 duration-150 ease-out";
