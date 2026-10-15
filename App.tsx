import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cup } from './src/components/Cup';
import { DieView } from './src/components/DieView';
import { FaceCounts } from './src/components/FaceCounts';
import { SettingsModal } from './src/components/SettingsModal';
import { useShake } from './src/hooks/useShake';
import { createDice, createDie, Die, MAX_DICE, MIN_DICE, rollAll } from './src/dice';
import { Settings, SHAKE_THRESHOLDS, usePersistedSettings } from './src/settings';

const ROLL_DURATION_MS = 600;

export default function App() {
  const { settings, update } = usePersistedSettings();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {settings ? (
        <DiceScreen settings={settings} updateSettings={update} />
      ) : (
        <View style={styles.container} />
      )}
    </SafeAreaProvider>
  );
}

function KeepScreenAwake() {
  useKeepAwake();
  return null;
}

type DiceScreenProps = {
  settings: Settings;
  updateSettings: (changes: Partial<Settings>) => void;
};

function DiceScreen({ settings, updateSettings }: DiceScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [dice, setDice] = useState<Die[]>(() => createDice(settings.diceCount));
  const [rolling, setRolling] = useState(false);
  const [locked, setLocked] = useState(false);
  /** The cup is over the dice (only with the "hide after roll" setting). */
  const [covered, setCovered] = useState(false);
  /** The player is holding the cup up to look underneath. */
  const [peeking, setPeeking] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const rollSound = useAudioPlayer(require('./assets/sounds/dice-roll.mp3'));
  const shuffleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { hideAfterRoll, vibration, sound } = settings;
  const showDice = !covered || peeking;
  const total = dice.reduce((sum, d) => sum + d.value, 0);
  const columns = dice.length > 9 ? 4 : 3;
  const dieSize = Math.min(90, (width - 48) / columns - 16);

  // Turning the cup off uncovers the dice straight away.
  useEffect(() => {
    if (!hideAfterRoll) setCovered(false);
  }, [hideAfterRoll]);

  const roll = useCallback(() => {
    if (rolling || locked) return;
    setRolling(true);
    setPeeking(false);
    if (hideAfterRoll) setCovered(true);
    if (vibration) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // Rewind first so back-to-back rolls replay the sound from the start.
    if (sound) rollSound.seekTo(0).then(() => rollSound.play()).catch(() => {});

    // Flicker random faces while the dice spin, then settle on the final roll.
    shuffleTimer.current = setInterval(() => {
      setDice(rollAll);
    }, 80);

    setTimeout(() => {
      if (shuffleTimer.current) clearInterval(shuffleTimer.current);
      setDice(rollAll);
      setRolling(false);
      if (vibration) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, ROLL_DURATION_MS);
  }, [rolling, locked, hideAfterRoll, vibration, sound, rollSound]);

  useEffect(() => () => {
    if (shuffleTimer.current) clearInterval(shuffleTimer.current);
  }, []);

  useShake(roll, SHAKE_THRESHOLDS[settings.shakeSensitivity], !settingsOpen);

  const tap = () => {
    if (vibration) Haptics.selectionAsync().catch(() => {});
  };

  const toggleLock = () => {
    tap();
    setLocked((l) => !l);
  };

  const toggleCover = () => {
    tap();
    setPeeking(false);
    setCovered((c) => !c);
  };

  const changeCount = (delta: 1 | -1) => {
    const count = Math.min(MAX_DICE, Math.max(MIN_DICE, dice.length + delta));
    if (count === dice.length) return;
    setDice((prev) => (delta > 0 ? [...prev, createDie()] : prev.slice(0, -1)));
    updateSettings({ diceCount: count });
  };

  const hint = locked
    ? 'Dice locked · Unlock to roll again'
    : covered
      ? 'Hold the cup to peek · Reveal to show everyone'
      : 'Shake the phone or press Roll';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      {settings.keepAwake && <KeepScreenAwake />}

      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.title}>LiarDice</Text>
        <Pressable
          style={({ pressed }) => [styles.headerSide, styles.gear, pressed && styles.pressed]}
          onPress={() => setSettingsOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
        >
          <Text style={styles.gearText}>⚙️</Text>
        </Pressable>
      </View>

      <View style={styles.counter}>
        <CounterButton label="−" onPress={() => changeCount(-1)} disabled={rolling || locked || dice.length <= MIN_DICE} />
        <Text style={styles.count}>
          {dice.length} {dice.length === 1 ? 'die' : 'dice'}
        </Text>
        <CounterButton label="+" onPress={() => changeCount(1)} disabled={rolling || locked || dice.length >= MAX_DICE} />
      </View>

      {/* The board fills the free space and centers its content whatever the
          number of dice. While covered, the whole board is the peek area: it
          stays mounted, so releasing the finger always ends the peek. */}
      <Pressable
        style={styles.board}
        disabled={!covered || rolling}
        onPressIn={() => setPeeking(true)}
        onPressOut={() => setPeeking(false)}
        accessible={covered}
        accessibilityRole={covered ? 'button' : undefined}
        accessibilityLabel={covered ? 'Dice are hidden under the cup' : undefined}
        accessibilityHint={covered ? 'Press and hold to peek at your dice' : undefined}
      >
        {showDice ? (
          <View style={styles.diceRow}>
            {dice.map((d) => (
              <DieView key={d.id} value={d.value} locked={locked} rolling={rolling} size={dieSize} />
            ))}
          </View>
        ) : (
          <Cup rolling={rolling} />
        )}
      </Pressable>

      {hideAfterRoll && (
        <Pressable
          style={({ pressed }) => [styles.pill, pressed && styles.pressed, rolling && styles.disabled]}
          onPress={toggleCover}
          disabled={rolling}
          accessibilityRole="button"
        >
          <Text style={styles.pillText}>{covered ? '👁 Reveal' : '🎲 Cover'}</Text>
        </Pressable>
      )}

      <View style={styles.info}>
        {showDice && !rolling ? (
          <>
            <FaceCounts dice={dice} onesWild={settings.onesWild} />
            <Text style={styles.total}>Total: {total}</Text>
          </>
        ) : (
          <Text style={styles.total}>{rolling ? 'Rolling…' : 'Hidden'}</Text>
        )}
      </View>
      <Text style={styles.hint}>{hint}</Text>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            locked && styles.lockActive,
            pressed && styles.pressed,
            rolling && styles.disabled,
          ]}
          onPress={toggleLock}
          disabled={rolling}
          accessibilityRole="button"
          accessibilityLabel={locked ? 'Unlock all dice' : 'Lock all dice'}
        >
          <Text style={[styles.secondaryText, locked && styles.lockActiveText]}>
            {locked ? '🔓 Unlock' : '🔒 Lock'}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.rollButton,
            pressed && styles.pressed,
            (locked || rolling) && styles.disabled,
          ]}
          onPress={roll}
          disabled={locked || rolling}
          accessibilityRole="button"
        >
          <Text style={styles.rollText}>{locked ? 'Locked' : 'Roll'}</Text>
        </Pressable>
      </View>

      <SettingsModal
        visible={settingsOpen}
        settings={settings}
        onChange={updateSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </View>
  );
}

function CounterButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.counterButton, pressed && styles.pressed, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'Add a die' : 'Remove a die'}
    >
      <Text style={styles.counterText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b5d3b',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  headerSide: { width: 44, height: 44 },
  title: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: 1 },
  gear: { alignItems: 'center', justifyContent: 'center' },
  gearText: { fontSize: 26 },
  counter: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 20 },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: { color: '#fff', fontSize: 28, fontWeight: '700', lineHeight: 32 },
  count: { color: '#fff', fontSize: 20, fontWeight: '600', minWidth: 90, textAlign: 'center' },
  board: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginVertical: 16,
  },
  diceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 12,
  },
  pillText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  info: { minHeight: 90, alignItems: 'center', justifyContent: 'center', gap: 8 },
  total: { color: '#fff', fontSize: 22, fontWeight: '700' },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6, marginBottom: 20, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, width: '100%' },
  secondaryButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
  },
  secondaryText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  lockActive: { backgroundColor: '#ffca28', borderColor: '#ffca28' },
  lockActiveText: { color: '#3e2700' },
  rollButton: {
    flex: 2,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#ffca28',
    alignItems: 'center',
  },
  rollText: { color: '#3e2700', fontSize: 22, fontWeight: '800', textTransform: 'uppercase' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
