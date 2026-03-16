import type { RealtimeChannel } from '@supabase/supabase-js';

import supabaseService from './SupabaseService';

class RealtimeFeedService {
  private client = supabaseService.getClient();

  subscribeToFeed(onChange: () => void) {
    const channel = this.client
      .channel('nutrition-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_posts' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_comments' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_likes' }, onChange)
      .subscribe();

    return () => {
      void this.client.removeChannel(channel as RealtimeChannel);
    };
  }
}

const realtimeFeedService = new RealtimeFeedService();

export default realtimeFeedService;
