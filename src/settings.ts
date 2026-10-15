import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MAX_DICE, MIN_DICE } from './dice';

export type ShakeSensitivity = 'low' | 'medium' | 'high';

export type Settings = {
  diceCount: number;
  /** Cover the dice with the cup after every roll; hold to peek. */
  hideAfterRoll: boolean;
  /** 1s count towards every other face in the per-face counts. */
  onesWild: boolean;
  sound: boolean;
  vibration: boolean;
  keepAwake: boolean;
  shakeSensitivity: ShakeSensitivity;
};

export const DEFAULT_SETTINGS: Settings = {
  diceCount: 5,
  hideAfterRoll: false,
  onesWild: false,
  sound: true,
  vibration: true,
  keepAwake: true,
  shakeSensitivity: 'medium',
};

/** Total acceleration (in g) needed to count as a shake. Resting is ~1g. */
export const SHAKE_THRESHOLDS: Record<ShakeSensitivity, number> = {
  low: 2.3,
  medium: 1.8,
  high: 1.4,
};

const STORAGE_KEY = 'liardice:settings';

/** Merges stored JSON over the defaults, dropping anything malformed. */
export function parseSettings(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS;
  let stored: Partial<Record<keyof Settings, unknown>>;
  try {
    stored = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (typeof stored !== 'object' || stored === null) return DEFAULT_SETTINGS;

  const settings: Settings = { ...DEFAULT_SETTINGS };
  const count = stored.diceCount;
  if (typeof count === 'number' && Number.isInteger(count) && count >= MIN_DICE && count <= MAX_DICE) {
    settings.diceCount = count;
  }
  for (const key of ['hideAfterRoll', 'onesWild', 'sound', 'vibration', 'keepAwake'] as const) {
    if (typeof stored[key] === 'boolean') settings[key] = stored[key];
  }
  const sensitivity = stored.shakeSensitivity;
  if (sensitivity === 'low' || sensitivity === 'medium' || sensitivity === 'high') {
    settings.shakeSensitivity = sensitivity;
  }
  return settings;
}

/** Settings persisted on the device. `settings` is null until loaded. */
export function usePersistedSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(parseSettings)
      .catch(() => DEFAULT_SETTINGS)
      .then(setSettings);
  }, []);

  const update = useCallback((changes: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...(prev ?? DEFAULT_SETTINGS), ...changes };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { settings, update };
}
