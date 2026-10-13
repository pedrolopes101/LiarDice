export type Die = {
  id: number;
  value: number;
};

export const MIN_DICE = 1;
export const MAX_DICE = 12;

let nextId = 0;

export function randomFace(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function createDie(): Die {
  return { id: nextId++, value: randomFace() };
}

export function createDice(count: number): Die[] {
  return Array.from({ length: count }, createDie);
}

export function rollAll(dice: Die[]): Die[] {
  return dice.map((d) => ({ ...d, value: randomFace() }));
}
