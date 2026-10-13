import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { DieView } from './src/components/DieView';
import { useShake } from './src/hooks/useShake';
import { createDice, createDie, Die, MAX_DICE, MIN_DICE, rollAll } from './src/dice';

const ROLL_DURATION_MS = 600;

export default function App() {
  const [dice, setDice] = useState<Die[]>(() => createDice(5));
  const [rolling, setRolling] = useState(false);
  const [locked, setLocked] = useState(false);
  const shuffleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const { width } = useWindowDimensions();

  const total = dice.reduce((sum, d) => sum + d.value, 0);
  const dieSize = Math.min(90, (width - 48) / 3 - 16);

  const roll = useCallback(() => {
    if (rolling || locked) return;
    setRolling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Flicker random faces while the dice spin, then settle on the final roll.
    shuffleTimer.current = setInterval(() => {
      setDice(rollAll);
    }, 80);

    setTimeout(() => {
      if (shuffleTimer.current) clearInterval(shuffleTimer.current);
      setDice(rollAll);
      setRolling(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, ROLL_DURATION_MS);
  }, [rolling, locked]);

  useEffect(() => () => {
    if (shuffleTimer.current) clearInterval(shuffleTimer.current);
  }, []);

  useShake(roll);

  const toggleLock = () => {
    Haptics.selectionAsync().catch(() => {});
    setLocked((l) => !l);
  };

  const addDie = () => setDice((prev) => (prev.length < MAX_DICE ? [...prev, createDie()] : prev));
  const removeDie = () => setDice((prev) => (prev.length > MIN_DICE ? prev.slice(0, -1) : prev));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.title}>Dice</Text>

      <View style={styles.counter}>
        <CounterButton label="−" onPress={removeDie} disabled={rolling || locked || dice.length <= MIN_DICE} />
        <Text style={styles.count}>
          {dice.length} {dice.length === 1 ? 'die' : 'dice'}
        </Text>
        <CounterButton label="+" onPress={addDie} disabled={rolling || locked || dice.length >= MAX_DICE} />
      </View>

      <View style={styles.board}>
        {dice.map((d) => (
          <DieView
            key={d.id}
            value={d.value}
            locked={locked}
            rolling={rolling}
            size={dieSize}
          />
        ))}
      </View>

      <Text style={styles.total}>Total: {rolling ? '…' : total}</Text>
      <Text style={styles.hint}>{locked ? 'Dice locked · Unlock to roll again' : 'Shake the phone or press Roll'}</Text>

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
        >
          <Text style={styles.rollText}>{locked ? 'Locked' : 'Roll'}</Text>
        </Pressable>
      </View>
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
    paddingTop: 70,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  title: { color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: 1 },
  counter: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 20 },
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: 20,
    width: '100%',
  },
  total: { color: '#fff', fontSize: 22, fontWeight: '700' },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6, marginBottom: 20 },
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
