# LiarDice

A simple dice app for iOS and Android, built with Expo (React Native).

## Features

- **Add / remove dice** with the `+` / `−` buttons (1–12 dice).
- **Roll** by pressing the *Roll* button **or by shaking the phone**.
- **Lock a die** by tapping it — locked dice turn yellow and keep their value on the next roll. Tap again to unlock, or use *Unlock all*.
- Running total, roll animation and haptic feedback.

## Running it

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone (shake detection needs a real device — simulators have no accelerometer).

## Project layout

- `App.tsx` — main screen (dice count, board, roll / unlock buttons)
- `src/components/DieView.tsx` — a single die with pips, lock state and spin animation
- `src/hooks/useShake.ts` — accelerometer-based shake detection (`expo-sensors`)
- `src/dice.ts` — dice state helpers

## Getting an APK

Every push to `main` runs the **Build Android APK** GitHub Actions workflow (you can also start it manually from the *Actions* tab). When it finishes, download the `LiarDice-apk` artifact from the run page, unzip it and install the `.apk` on your Android phone (allow "install unknown apps" when asked).

The APK is signed with the debug key, so it is for testing only — not for the Play Store.
