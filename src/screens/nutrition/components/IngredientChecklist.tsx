import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type { ShoppingItem } from '../../../models';
import { colors, theme, typography } from '../../../theme';

interface IngredientChecklistProps {
  items: ShoppingItem[];
}

export function IngredientChecklist({ items }: IngredientChecklistProps) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <Pressable key={`${item.item}-${item.quantity}`} style={styles.row}>
          <View style={styles.checkbox} />
          <View style={styles.body}>
            <Text style={styles.item}>{item.item}</Text>
            <Text style={styles.qty}>{item.quantity}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border_strong,
    backgroundColor: colors.bg_elevated,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    ...typography.body_md,
  },
  qty: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
});
