import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

/** Minimum time between two shake events, so one shake = one roll. */
const COOLDOWN_MS = 1200;

/**
 * Calls `onShake` whenever the device is shaken harder than `threshold`
 * (total acceleration in g; resting is ~1g).
 */
export function useShake(onShake: () => void, threshold: number, enabled = true) {
  const callback = useRef(onShake);
  callback.current = onShake;

  useEffect(() => {
    if (!enabled) return;

    let lastShake = 0;
    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    Accelerometer.isAvailableAsync().then((available) => {
      if (!available || cancelled) return;
      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const force = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();
        if (force > threshold && now - lastShake > COOLDOWN_MS) {
          lastShake = now;
          callback.current();
        }
      });
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, threshold]);
}
