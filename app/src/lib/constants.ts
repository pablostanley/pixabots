import { totalCombinations } from "@pixabots/core";

export const SITE_URL = "https://pixabots.com";

/**
 * Total number of unique pixabots — derived once from the parts catalog
 * so the app never drifts from core. Use `TOTAL_COMBOS_LABEL` for
 * human-readable copy.
 */
export const TOTAL_COMBOS = totalCombinations();
export const TOTAL_COMBOS_LABEL = TOTAL_COMBOS.toLocaleString("en-US");
