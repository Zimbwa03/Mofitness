import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { theme } from "../../theme";

interface PlaceholderScreenProps {
  title: string;
  subtitle: string;
}

export function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textMuted,
    textAlign: "center",
  },
});
