import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RealtimeChannel } from "@supabase/supabase-js";

import type { MessageRecord } from "../../features/findCoach/shared/types";
import type { FindCoachStackParamList } from "../../navigation/types";
import coachNetworkService from "../../services/CoachNetworkService";
import { useAuthStore } from "../../stores/authStore";
import { colors, radius, theme, typography } from "../../theme";
import { MoButton } from "../../components/common/MoButton";

type Props = NativeStackScreenProps<FindCoachStackParamList, "CoachChat">;

export function CoachChatScreen({ route }: Props) {
  const user = useAuthStore((state) => state.user);
  const [conversationId, setConversationId] = useState(route.params.conversationId ?? null);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [draft, setDraft] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    coachNetworkService
      .ensureConversation({
        coachId: route.params.coachId,
        userId: user.id,
      })
      .then((conversation) => setConversationId(conversation.id))
      .catch(() => undefined);
  }, [route.params.coachId, user]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    coachNetworkService.getMessages(conversationId).then(setMessages).catch(() => undefined);
    channelRef.current = coachNetworkService.subscribeToConversation(conversationId, (message) => {
      setMessages((current) =>
        current.some((entry) => entry.id === message.id) ? current : [...current, message],
      );
    });

    return () => {
      coachNetworkService.unsubscribe(channelRef.current);
      channelRef.current = null;
    };
  }, [conversationId]);

  async function handleSend() {
    if (!user || !conversationId || !draft.trim()) {
      return;
    }

    const message = await coachNetworkService.sendMessage({
      conversationId,
      senderId: user.id,
      body: draft.trim(),
    });
    setMessages((current) => [...current, message]);
    setDraft("");
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.messages}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.sender_type === "user" ? styles.userBubble : styles.coachBubble,
            ]}
          >
            <Text style={message.sender_type === "user" ? styles.userText : styles.coachText}>
              {message.body}
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          placeholder="Type a message..."
          placeholderTextColor={colors.text_secondary}
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
        />
        <MoButton size="medium" onPress={() => void handleSend()}>
          Send
        </MoButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg_primary,
  },
  messages: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  messageBubble: {
    maxWidth: "82%",
    borderRadius: radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent_green,
  },
  coachBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
  },
  userText: {
    ...typography.body_sm,
    color: colors.text_inverse,
  },
  coachText: {
    ...typography.body_sm,
    color: colors.text_primary,
  },
  composer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border_subtle,
  },
  input: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.bg_surface,
    borderWidth: 1,
    borderColor: colors.border_subtle,
    color: colors.text_primary,
    paddingHorizontal: theme.spacing.md,
    minHeight: 44,
  },
});
