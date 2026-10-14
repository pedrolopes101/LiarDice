import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Settings, ShakeSensitivity } from '../settings';

type Props = {
  visible: boolean;
  settings: Settings;
  onChange: (changes: Partial<Settings>) => void;
  onClose: () => void;
};

type ToggleKey = 'hideAfterRoll' | 'onesWild' | 'sound' | 'vibration' | 'keepAwake';

const TOGGLES: { key: ToggleKey; title: string; detail: string }[] = [
  {
    key: 'hideAfterRoll',
    title: 'Hide dice after roll',
    detail: 'Cover the dice with a cup after every roll. Hold to peek, tap Reveal to show.',
  },
  { key: 'onesWild', title: '1s are wild', detail: 'Count 1s towards every other face.' },
  { key: 'sound', title: 'Sound', detail: 'Play the dice-rolling sound.' },
  { key: 'vibration', title: 'Vibration', detail: 'Vibrate when rolling and pressing buttons.' },
  { key: 'keepAwake', title: 'Keep screen on', detail: "Don't let the screen turn off while the app is open." },
];

const SENSITIVITIES: { value: ShakeSensitivity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function SettingsModal({ visible, settings, onChange, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close settings" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {TOGGLES.map(({ key, title, detail }) => (
            <View key={key} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowDetail}>{detail}</Text>
              </View>
              <Switch
                value={settings[key]}
                onValueChange={(value) => onChange({ [key]: value })}
                trackColor={{ true: '#ffca28', false: '#bdbdbd' }}
                thumbColor="#fff"
                accessibilityLabel={title}
              />
            </View>
          ))}

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Shake sensitivity</Text>
              <Text style={styles.rowDetail}>How hard you need to shake the phone to roll.</Text>
            </View>
          </View>
          <View style={styles.segments}>
            {SENSITIVITIES.map(({ value, label }) => {
              const selected = settings.shakeSensitivity === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => onChange({ shakeSensitivity: value })}
                  style={[styles.segment, selected && styles.segmentSelected]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1b1b1b' },
  done: { fontSize: 17, fontWeight: '700', color: '#0b5d3b' },
  content: { paddingHorizontal: 20, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: '#1b1b1b' },
  rowDetail: { fontSize: 13, color: '#666', marginTop: 2 },
  segments: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0b5d3b',
    alignItems: 'center',
  },
  segmentSelected: { backgroundColor: '#0b5d3b' },
  segmentText: { fontSize: 15, fontWeight: '600', color: '#0b5d3b' },
  segmentTextSelected: { color: '#fff' },
});
