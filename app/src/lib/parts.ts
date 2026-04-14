import {
  PARTS,
  LAYER_ORDER,
  type PartCategory as CorePartCategory,
} from "@pixabots/core";

export type PartCategory = CorePartCategory;

export interface PartOption {
  name: string;
  src: string;
}

export interface PartsConfig {
  [key: string]: PartOption[];
}

// Re-export layer order from core
export const layerOrder: PartCategory[] = [...LAYER_ORDER];

export const layerLabel: Record<PartCategory, string> = {
  top: "top",
  body: "body",
  heads: "heads",
  eyes: "face",
};

// Convert core paths to app-specific /parts/ URLs
export const parts: PartsConfig = Object.fromEntries(
  Object.entries(PARTS).map(([cat, options]) => [
    cat,
    options.map((o) => ({ name: o.name, src: `/parts/${o.path}` })),
  ])
);
