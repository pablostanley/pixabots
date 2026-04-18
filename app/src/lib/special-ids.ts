export const SPECIAL_IDS: Record<string, string> = {
  "2156": "The mascot",
  "1337": "nice",
  "0000": "Genesis",
  f76a: "The last pixabot",
  "0001": "First from the end",
};

export function specialNote(id: string): string | undefined {
  return SPECIAL_IDS[id];
}
