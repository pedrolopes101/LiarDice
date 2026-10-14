import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';

type Props = {
  rolling: boolean;
};

/**
 * The dice cup drawn over hidden dice. Peeking is handled by the parent, so the
 * press survives swapping the cup for the dice while the finger is down.
 */
export function Cup({ rolling }: Props) {
  const wiggle = useRef(new Animated.Value(0)).current;

  // Rattle the cup while the dice roll underneath it.
  useEffect(() => {
    if (!rolling) return;
    const shake = Animated.loop(
      Animated.sequence([
        Animated.timing(wiggle, { toValue: 1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -1, duration: 120, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 60, easing: Easing.linear, useNativeDriver: true }),
      ]),
    );
    shake.start();
    return () => {
      shake.stop();
      wiggle.setValue(0);
    };
  }, [rolling, wiggle]);

  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-6deg', '6deg'] });

  return (
    <Animated.View style={[styles.cup, { transform: [{ rotate }] }]}>
      <Text style={styles.icon}>🎲</Text>
      <Text style={styles.label}>{rolling ? 'Rolling…' : 'Hold to peek'}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cup: {
    alignSelf: 'center',
    width: 220,
    height: 200,
    backgroundColor: '#5d3a1a',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 90,
    borderBottomRightRadius: 90,
    borderWidth: 6,
    borderColor: '#3e2510',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  icon: { fontSize: 40 },
  label: { color: '#f3e3cf', fontSize: 18, fontWeight: '700' },
});
