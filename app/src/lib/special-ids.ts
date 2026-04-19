export const SPECIAL_IDS: Record<string, string> = {
  "2156": "The mascot",
  "1337": "nice",
  "0000": "Genesis",
  f76a: "The last pixabot",
  "0001": "First from the end",
  "1234": "Sequential",
  "3141": "Pi",
  "1111": "All ones",
  "6543": "Countdown",
  a001: "Space odyssey",
  "2026": "Class of 2026",
};

export function specialNote(id: string): string | undefined {
  return SPECIAL_IDS[id];
}
