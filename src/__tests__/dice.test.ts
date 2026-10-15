import { describe, expect, it } from '@jest/globals';

import { countFaces, createDice, createDie, Die, randomFace, rollAll } from '../dice';

const dice = (...values: number[]): Die[] => values.map((value, id) => ({ id, value }));

describe('randomFace', () => {
  it('only returns 1 to 6, and all of them', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(randomFace());
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('createDice', () => {
  it('creates the requested number of dice with unique ids', () => {
    const created = createDice(7);
    expect(created).toHaveLength(7);
    expect(new Set(created.map((d) => d.id)).size).toBe(7);
    expect(createDie().id).not.toBe(created[6].id);
  });
});

describe('rollAll', () => {
  it('keeps the dice (ids and count) but gives them valid new values', () => {
    const before = createDice(12);
    const after = rollAll(before);
    expect(after.map((d) => d.id)).toEqual(before.map((d) => d.id));
    for (const d of after) expect(d.value).toBeGreaterThanOrEqual(1);
    for (const d of after) expect(d.value).toBeLessThanOrEqual(6);
  });

  it('does not mutate the input', () => {
    const before = dice(1, 1, 1);
    rollAll(before);
    expect(before).toEqual(dice(1, 1, 1));
  });
});

describe('countFaces', () => {
  it('counts each face', () => {
    expect(countFaces(dice(1, 3, 3, 6, 6, 6))).toEqual({ 1: 1, 2: 0, 3: 2, 4: 0, 5: 0, 6: 3 });
  });

  it('adds the 1s to every other face when 1s are wild', () => {
    expect(countFaces(dice(1, 1, 3, 6), true)).toEqual({ 1: 2, 2: 2, 3: 3, 4: 2, 5: 2, 6: 3 });
  });

  it('handles no dice', () => {
    expect(countFaces([], true)).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  });
});
