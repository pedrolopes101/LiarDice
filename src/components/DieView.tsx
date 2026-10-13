import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

// Pip positions on a 3x3 grid (row, col) for each face.
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

// Pip color for each face: 1 is red, every other number has its own color.
const PIP_COLORS: Record<number, string> = {
  1: '#d32f2f',
  2: '#1565c0',
  3: '#2e7d32',
  4: '#6a1b9a',
  5: '#ef6c00',
  6: '#212121',
};

type Props = {
  value: number;
  locked: boolean;
  rolling: boolean;
  size: number;
};

export function DieView({ value, locked, rolling, size }: Props) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!rolling || locked) return;
    spin.setValue(0);
    Animated.timing(spin, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [rolling, locked, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });
  const scale = spin.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.8, 1] });

  const pip = size * 0.18;
  const cell = size / 3;

  return (
    <View accessible accessibilityLabel={`Die showing ${value}${locked ? ', locked' : ''}`}>
      <Animated.View
        style={[
          styles.die,
          { width: size, height: size, borderRadius: size * 0.18 },
          locked && styles.locked,
          { transform: [{ rotate }, { scale }] },
        ]}
      >
        {PIPS[value].map(([row, col], i) => (
          <View
            key={i}
            style={[
              styles.pip,
              {
                backgroundColor: PIP_COLORS[value],
                width: pip,
                height: pip,
                borderRadius: pip / 2,
                top: row * cell + (cell - pip) / 2,
                left: col * cell + (cell - pip) / 2,
              },
            ]}
          />
        ))}
      </Animated.View>
      {locked && <Text style={styles.lockBadge}>🔒</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  die: {
    backgroundColor: '#fdfdfd',
    borderWidth: 2,
    borderColor: '#d0d0d0',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  locked: {
    borderColor: '#ffca28',
    borderWidth: 4,
  },
  pip: {
    position: 'absolute',
  },
  lockBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 18,
  },
});
