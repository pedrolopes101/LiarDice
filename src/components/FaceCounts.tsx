import { StyleSheet, Text, View } from 'react-native';

import { Die, FACES, countFaces } from '../dice';
import { DieView } from './DieView';

type Props = {
  dice: Die[];
  onesWild: boolean;
};

/** A small die per face with how many of the rolled dice count as that face. */
export function FaceCounts({ dice, onesWild }: Props) {
  const counts = countFaces(dice, onesWild);
  return (
    <View>
      <View style={styles.row} accessible accessibilityLabel={FACES.map((f) => `${counts[f]} ${f}s`).join(', ')}>
        {FACES.map((face) => (
          <View key={face} style={[styles.cell, counts[face] === 0 && styles.empty]}>
            <DieView value={face} locked={false} rolling={false} size={26} />
            <Text style={styles.count}>{counts[face]}</Text>
          </View>
        ))}
      </View>
      {onesWild && <Text style={styles.note}>1s are wild — counted in every face</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  cell: { alignItems: 'center', gap: 4 },
  empty: { opacity: 0.4 },
  count: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center', marginTop: 6 },
});
