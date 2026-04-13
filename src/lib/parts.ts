export type PartCategory = "top" | "body" | "heads" | "eyes";

export interface PartOption {
  name: string;
  src: string;
}

export interface PartsConfig {
  [key: string]: PartOption[];
}

// Z-index order (bottom to top): top, body, heads, eyes
export const layerOrder: PartCategory[] = ["top", "body", "heads", "eyes"];

export const layerLabel: Record<PartCategory, string> = {
  top: "top",
  body: "body",
  heads: "heads",
  eyes: "face",
};

export const parts: PartsConfig = {
  eyes: [
    { name: "big-face", src: "/parts/eyes/big-face.png" },
    { name: "glasses", src: "/parts/eyes/glasses.png" },
    { name: "human", src: "/parts/eyes/human.png" },
    { name: "human-2", src: "/parts/eyes/human-2.png" },
    { name: "monitor", src: "/parts/eyes/monitor.png" },
    { name: "monitor-round", src: "/parts/eyes/monitor-round.png" },
    { name: "mustache", src: "/parts/eyes/mustache.png" },
    { name: "terminal", src: "/parts/eyes/terminal.png" },
    { name: "terminal-green", src: "/parts/eyes/terminal-green.png" },
    { name: "terminal-light", src: "/parts/eyes/terminal-light.png" },
    { name: "terminal-round", src: "/parts/eyes/terminal-round.png" },
    { name: "tight-visor", src: "/parts/eyes/tight-visor.png" },
    { name: "visor", src: "/parts/eyes/visor.png" },
    { name: "wayfarer", src: "/parts/eyes/wayfarer.png" },
    { name: "wayfarer-face", src: "/parts/eyes/wayfarer-face.png" },
  ],
  heads: [
    { name: "ac", src: "/parts/heads/ac.png" },
    { name: "blob", src: "/parts/heads/blob.png" },
    { name: "blob-blue", src: "/parts/heads/blob-blue.png" },
    { name: "bowl", src: "/parts/heads/bowl.png" },
    { name: "box", src: "/parts/heads/box.png" },
    { name: "commodore", src: "/parts/heads/commodore.png" },
    { name: "frame", src: "/parts/heads/frame.png" },
    { name: "punch-bowl", src: "/parts/heads/punch-bowl.png" },
  ],
  body: [
    { name: "backpack", src: "/parts/body/backpack.png" },
    { name: "claws", src: "/parts/body/claws.png" },
    { name: "heart", src: "/parts/body/heart.png" },
    { name: "swag", src: "/parts/body/swag.png" },
    { name: "tank", src: "/parts/body/tank.png" },
    { name: "wings", src: "/parts/body/wings.png" },
    { name: "fire", src: "/parts/body/fire.png" },
  ],
  top: [
    { name: "antenna", src: "/parts/top/antenna.png" },
    { name: "bulb", src: "/parts/top/bulb.png" },
    { name: "bunny-ears", src: "/parts/top/bunny-ears.png" },
    { name: "leaf", src: "/parts/top/leaf.png" },
    { name: "lollypop", src: "/parts/top/lollypop.png" },
    { name: "mohawk", src: "/parts/top/mohawk.png" },
    { name: "bun", src: "/parts/top/bun.png" },
    { name: "horns", src: "/parts/top/horns.png" },
  ],
};
