import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { typography } from "../../theme";
import { MoCard } from "./MoCard";

interface SectionCardProps {
  children: ReactNode;
  subtitle?: string;
  title: string;
}

export function SectionCard({ children, subtitle, title }: SectionCardProps) {
  return (
    <MoCard>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodyMedium" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </MoCard>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  title: {
    ...typography.display_sm,
  },
  subtitle: {
    ...typography.body_md,
  },
});
