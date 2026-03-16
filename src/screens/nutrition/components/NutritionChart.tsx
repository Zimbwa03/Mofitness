import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { SimpleBarChart } from '../../../components/charts/SimpleBarChart';
import { SimpleLineChart } from '../../../components/charts/SimpleLineChart';
import { colors, theme, typography } from '../../../theme';

interface NutritionChartProps {
  title: string;
  mode: 'bar' | 'line';
  data: Array<{ x: string; y: number }>;
}

export function NutritionChart({ title, mode, data }: NutritionChartProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {mode === 'bar' ? <SimpleBarChart data={data} /> : <SimpleLineChart data={data} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg_surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    padding: theme.spacing.md,
  },
  title: {
    ...typography.body_xl,
    marginBottom: theme.spacing.sm,
  },
});
