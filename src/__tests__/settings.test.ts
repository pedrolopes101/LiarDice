import { describe, expect, it, jest } from '@jest/globals';

import { DEFAULT_SETTINGS, parseSettings } from '../settings';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('parseSettings', () => {
  it('returns the defaults when nothing is stored or the data is broken', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('not json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('null')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('42')).toEqual(DEFAULT_SETTINGS);
  });

  it('restores stored values', () => {
    const stored = {
      diceCount: 3,
      hideAfterRoll: true,
      onesWild: true,
      sound: false,
      vibration: false,
      keepAwake: false,
      shakeSensitivity: 'high',
    };
    expect(parseSettings(JSON.stringify(stored))).toEqual(stored);
  });

  it('fills in settings missing from older saves', () => {
    expect(parseSettings(JSON.stringify({ diceCount: 8 }))).toEqual({ ...DEFAULT_SETTINGS, diceCount: 8 });
  });

  it('ignores invalid values', () => {
    const stored = { diceCount: 99, sound: 'yes', shakeSensitivity: 'extreme', onesWild: true };
    expect(parseSettings(JSON.stringify(stored))).toEqual({ ...DEFAULT_SETTINGS, onesWild: true });
    expect(parseSettings(JSON.stringify({ diceCount: 2.5 })).diceCount).toBe(DEFAULT_SETTINGS.diceCount);
    expect(parseSettings(JSON.stringify({ diceCount: 0 })).diceCount).toBe(DEFAULT_SETTINGS.diceCount);
  });
});
