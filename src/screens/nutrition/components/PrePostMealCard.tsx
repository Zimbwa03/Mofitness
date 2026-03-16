import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors, theme, typography } from '../../../theme';
import { splitActionText } from '../../../utils/nutrition';

interface PrePostMealCardProps {
  phase: 'before' | 'after';
  content: string;
}

export function PrePostMealCard({ phase, content }: PrePostMealCardProps) {
  const items = splitActionText(content);
  const accent = phase === 'before' ? colors.accent_green : colors.accent_blue;

  return (
    <View style={[styles.card, { borderColor: accent }]}> 
      <Text style={[styles.title, { color: accent }]}>{phase === 'before' ? 'Before This Meal' : 'After This Meal'}</Text>
      {(items.length > 0 ? items : [content]).map((item) => (
        <Text key={item} style={styles.item}>• {item}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg_surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  title: {
    ...typography.body_md,
    fontFamily: theme.typography.bold,
  },
  item: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
});
