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

export const FACES = [1, 2, 3, 4, 5, 6] as const;

/**
 * How many dice show each face. With `onesWild`, 1s also count towards every
 * other face (the common Liar's Dice house rule), so `counts[1]` stays the
 * plain number of 1s.
 */
export function countFaces(dice: Die[], onesWild = false): Record<number, number> {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  for (const d of dice) counts[d.value]++;
  if (onesWild) {
    for (const face of FACES) if (face !== 1) counts[face] += counts[1];
  }
  return counts;
}
