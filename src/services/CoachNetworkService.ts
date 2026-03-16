import type { RealtimeChannel } from "@supabase/supabase-js";

import type {
  CoachRecord,
  ConversationRecord,
  MessageRecord,
} from "../features/findCoach/shared/types";
import supabaseService from "./SupabaseService";

class CoachNetworkService {
  private client = supabaseService.getClient();

  async getApprovedCoaches() {
    const { data, error } = await this.client
      .from("coaches")
      .select("*")
      .eq("status", "approved")
      .order("is_featured", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as unknown as CoachRecord[];
  }

  async getCoachById(id: string) {
    const { data, error } = await this.client
      .from("coaches")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data ?? null) as CoachRecord | null;
  }

  async getConversationsForUser(userId: string) {
    const { data, error } = await this.client
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("last_msg_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as unknown as ConversationRecord[];
  }

  async getMessages(conversationId: string) {
    const { data, error } = await this.client
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as unknown as MessageRecord[];
  }

  async ensureConversation(args: { coachId: string; userId: string }) {
    const existing = await this.client
      .from("conversations")
      .select("*")
      .eq("coach_id", args.coachId)
      .eq("user_id", args.userId)
      .maybeSingle();

    if (existing.error) {
      throw existing.error;
    }

    if (existing.data) {
      return existing.data as ConversationRecord;
    }

    const { data, error } = await this.client
      .from("conversations")
      .insert({
        coach_id: args.coachId,
        user_id: args.userId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as unknown as ConversationRecord;
  }

  async sendMessage(args: {
    conversationId: string;
    senderId: string;
    body: string;
  }) {
    const { data, error } = await this.client
      .from("messages")
      .insert({
        conversation_id: args.conversationId,
        sender_id: args.senderId,
        sender_type: "user",
        body: args.body,
        attachments: [],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as unknown as MessageRecord;
  }

  subscribeToConversation(
    conversationId: string,
    onMessage: (message: MessageRecord) => void,
  ): RealtimeChannel {
    return this.client
      .channel(`coach-conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onMessage(payload.new as MessageRecord);
        },
      )
      .subscribe();
  }

  unsubscribe(channel: RealtimeChannel | null) {
    if (channel) {
      this.client.removeChannel(channel).catch(() => undefined);
    }
  }
}

const coachNetworkService = new CoachNetworkService();

export default coachNetworkService;
