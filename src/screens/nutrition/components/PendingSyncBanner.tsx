import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { MoCard } from '../../../components/common/MoCard';
import { colors, theme, typography } from '../../../theme';

interface PendingSyncBannerProps {
  count: number;
  body?: string;
}

export function PendingSyncBanner({ count, body }: PendingSyncBannerProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <MoCard variant="highlight">
      <View style={styles.row}>
        <Text style={styles.title}>{count} action{count === 1 ? '' : 's'} waiting to sync</Text>
        <Text style={styles.badge}>Queued</Text>
      </View>
      <Text style={styles.body}>
        {body ?? 'Your offline nutrition and feed actions are saved on this device and will sync automatically when the network is back.'}
      </Text>
    </MoCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...typography.body_xl,
  },
  badge: {
    ...typography.caption,
    color: colors.text_inverse,
    backgroundColor: colors.accent_green,
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
