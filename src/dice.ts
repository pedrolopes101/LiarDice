export type Die = {
  id: number;
  value: number;
  locked: boolean;
};

export const MIN_DICE = 1;
export const MAX_DICE = 12;

let nextId = 0;

export function randomFace(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function createDie(): Die {
  return { id: nextId++, value: randomFace(), locked: false };
}

export function createDice(count: number): Die[] {
  return Array.from({ length: count }, createDie);
}

/** Re-rolls every die that isn't locked. */
export function rollUnlocked(dice: Die[]): Die[] {
  return dice.map((d) => (d.locked ? d : { ...d, value: randomFace() }));
}
