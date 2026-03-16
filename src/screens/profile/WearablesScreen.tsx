import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoBadge } from "../../components/common/MoBadge";
import { MoButton } from "../../components/common/MoButton";
import { MoCard } from "../../components/common/MoCard";
import { colors, layout, theme, typography } from "../../theme";
import { getScreenBottomPadding } from "../../utils/screen";

export function WearablesScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
    >
      <MoCard variant="glass">
        <Text style={styles.title}>Connect Devices</Text>
        <Text style={styles.body}>Bluetooth scanning and smart-equipment pairing land here.</Text>
        <View style={styles.radar} />
        <View style={styles.deviceCard}>
          <View>
            <Text style={styles.deviceName}>MoBell Pro X</Text>
            <Text style={styles.deviceMeta}>Smart Dumbbell</Text>
          </View>
          <MoBadge variant="blue">Strong Signal</MoBadge>
        </View>
        <MoButton>Connect Device</MoButton>
      </MoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingBottom: theme.spacing.xxxl },
  title: { ...typography.display_sm, marginBottom: theme.spacing.sm },
  body: { ...typography.body_md, color: colors.text_secondary, marginBottom: theme.spacing.md },
  radar: { height: 180, borderRadius: 90, borderWidth: 1, borderColor: colors.accent_green, backgroundColor: "rgba(200,241,53,0.04)", marginBottom: theme.spacing.md },
  deviceCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.bg_surface, borderRadius: theme.radius.md, padding: theme.spacing.md, marginBottom: theme.spacing.md },
  deviceName: { ...typography.body_xl },
  deviceMeta: { ...typography.body_sm, color: colors.text_secondary },
});
