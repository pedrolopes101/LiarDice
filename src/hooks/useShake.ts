import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

/** Total acceleration (in g) that counts as a shake. Resting is ~1g. */
const SHAKE_THRESHOLD = 1.8;
/** Minimum time between two shake events, so one shake = one roll. */
const COOLDOWN_MS = 1200;

/** Calls `onShake` whenever the device is shaken. */
export function useShake(onShake: () => void, enabled = true) {
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
        if (force > SHAKE_THRESHOLD && now - lastShake > COOLDOWN_MS) {
          lastShake = now;
          callback.current();
        }
      });
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);
}
