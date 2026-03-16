import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { MoCard } from '../../../components/common/MoCard';
import { colors, theme, typography } from '../../../theme';

interface OfflineStateBannerProps {
  title: string;
  body: string;
}

export function OfflineStateBanner({ title, body }: OfflineStateBannerProps) {
  return (
    <MoCard variant="amber">
      <View style={styles.row}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.badge}>Cached</Text>
      </View>
      <Text style={styles.body}>{body}</Text>
    </MoCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...typography.body_xl,
  },
  badge: {
    ...typography.caption,
    color: colors.text_inverse,
    backgroundColor: colors.accent_amber,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  body: {
    ...typography.body_sm,
    color: colors.text_secondary,
  },
});
