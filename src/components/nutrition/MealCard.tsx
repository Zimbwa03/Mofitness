import { StyleSheet, View } from "react-native";
import { Chip, Text } from "react-native-paper";

import type { MealSuggestion } from "../../models";
import { theme } from "../../theme";

interface MealCardProps {
  title: string;
  dishes: MealSuggestion[];
}

export function MealCard({ title, dishes }: MealCardProps) {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {dishes.map((dish) => (
        <Chip key={dish.name} style={styles.chip}>
          {dish.name} • {dish.calories} kcal
        </Chip>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
  },
  chip: {
    alignSelf: "flex-start",
  },
});
