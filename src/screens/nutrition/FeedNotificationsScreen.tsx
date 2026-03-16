import { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoachMessageBubble } from '../../components/coach/CoachMessageBubble';
import { MoCard } from '../../components/common/MoCard';
import { useAuth } from '../../hooks/useAuth';
import type { NutritionStackParamList } from '../../navigation/types';
import healthFeedService from '../../services/HealthFeedService';
import type { FeedActivityItem } from '../../models';
import { useOfflineQueueStore } from '../../stores/offlineQueueStore';
import { colors, layout, theme, typography } from '../../theme';
import { getScreenBottomPadding } from '../../utils/screen';
import { OfflineStateBanner } from './components/OfflineStateBanner';
import { PendingSyncBanner } from './components/PendingSyncBanner';

type Props = NativeStackScreenProps<NutritionStackParamList, 'FeedNotifications'>;

function relativeTime(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.floor(hours / 24)}d ago`;
}

export function FeedNotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const pendingSyncCount = useOfflineQueueStore((state) => state.pendingCount);
  const [items, setItems] = useState<FeedActivityItem[]>([]);
  const [activitySource, setActivitySource] = useState<'remote' | 'cache' | 'none'>('none');
  const [activitySourceReason, setActivitySourceReason] = useState<'connectivity' | 'local_cache' | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    healthFeedService
      .getFeedActivityWithStatus(user.id)
      .then((result) => {
        setItems(result.data);
        setActivitySource(result.source);
        setActivitySourceReason(result.reason);
      })
      .catch(() => undefined);
  }, [user]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: getScreenBottomPadding(insets.bottom, theme.spacing.xxl) }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Feed Notifications</Text>
      <Text style={styles.subtitle}>Recent activity on meals you shared publicly.</Text>
      <CoachMessageBubble
        feature="Nutrition"
        message={
          items.length > 0
            ? "I am tracking your feed activity in real time. Open any alert and I will help you turn feedback into better meal choices."
            : "No feed activity yet. Share your next meal and I will help you build momentum with the community."
        }
        pose={items.length > 0 ? 'chat' : 'nutrition'}
      />
      <PendingSyncBanner count={pendingSyncCount} body="Queued feed and nutrition actions will sync automatically once Mofitness reconnects." />
      {activitySource === 'cache' ? (
        <OfflineStateBanner
          title="Showing cached feed activity"
          body={
            activitySourceReason === 'connectivity'
              ? 'Notifications could not be refreshed from the network, so this list is using the latest activity saved on this device.'
              : 'This activity list is currently being shown from device storage.'
          }
        />
      ) : null}
      {items.map((item) => (
        <Pressable key={item.id} onPress={() => navigation.navigate('HealthFeedDetail', { postId: item.post_id })}>
          <MoCard>
            <Text style={styles.activityTitle}>{item.actor_name} {item.type === 'comment' ? 'commented on' : 'liked'} {item.post_name}</Text>
            {item.body ? <Text style={styles.activityBody}>{item.body}</Text> : null}
            <Text style={styles.activityMeta}>{relativeTime(item.created_at)}</Text>
          </MoCard>
        </Pressable>
      ))}
      {items.length === 0 ? (
        <MoCard>
          <CoachMessageBubble
            feature="Nutrition"
            message={
              activitySourceReason === 'connectivity'
                ? 'I could not refresh this from the network yet. I will keep watching and update this feed as soon as we reconnect.'
                : 'When people like or comment on your meal posts, they will show up here.'
            }
            pose={activitySourceReason === 'connectivity' ? 'warning' : 'nutrition'}
          />
          <Text style={styles.activityTitle}>{activitySourceReason === 'connectivity' ? 'Notifications unavailable offline' : 'No feed activity yet'}</Text>
          <Text style={styles.activityBody}>{activitySourceReason === 'connectivity' ? 'This device does not have cached feed activity yet.' : 'Post your first meal to begin receiving activity updates.'}</Text>
        </MoCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg_primary },
  content: { paddingHorizontal: layout.screen_padding_h, paddingVertical: theme.spacing.lg },
  title: { ...typography.display_md, marginBottom: theme.spacing.sm },
  subtitle: { ...typography.body_md, color: colors.text_secondary, marginBottom: theme.spacing.md },
  activityTitle: { ...typography.body_xl },
  activityBody: { ...typography.body_md, color: colors.text_secondary, marginTop: theme.spacing.xs },
  activityMeta: { ...typography.body_sm, color: colors.text_secondary, marginTop: theme.spacing.sm },
});
