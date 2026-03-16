import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Modal, Portal, Text } from "react-native-paper";

import { MoButton } from "../common/MoButton";
import { MoCard } from "../common/MoCard";
import { MoInput } from "../common/MoInput";
import { colors, theme, typography } from "../../theme";

interface CoachChatModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSend: (message: string) => Promise<string>;
}

export function CoachChatModal({ visible, onDismiss, onSend }: CoachChatModalProps) {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Portal>
      <Modal dismissable onDismiss={onDismiss} visible={visible} contentContainerStyle={styles.modal}>
        <MoCard variant="glass">
          <Text style={styles.title}>Ask Mo</Text>
          <Text style={styles.subheading}>Ask about pacing, form, recovery, or rest timing.</Text>
          <View style={styles.chatStack}>
            <View style={styles.coachBubble}>
              <Text style={styles.coachText}>I am here. Ask me anything about this session.</Text>
            </View>
            {reply ? (
              <View style={styles.replyBubble}>
                <Text style={styles.replyText}>{reply}</Text>
              </View>
            ) : null}
          </View>
          <MoInput label="Message" onChangeText={setMessage} value={message} />
          <View style={styles.actions}>
            <MoButton onPress={onDismiss} variant="secondary">
              Close
            </MoButton>
            <MoButton
              loading={loading}
              onPress={async () => {
                setLoading(true);
                const nextReply = await onSend(message);
                setReply(nextReply);
                setLoading(false);
              }}
            >
              Send
            </MoButton>
          </View>
        </MoCard>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: theme.spacing.lg,
  },
  title: {
    ...typography.display_sm,
    marginBottom: theme.spacing.xs,
  },
  subheading: {
    ...typography.body_sm,
    color: colors.text_secondary,
    marginBottom: theme.spacing.md,
  },
  chatStack: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  coachBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.bg_elevated,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    maxWidth: "85%",
  },
  replyBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent_green,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    maxWidth: "85%",
  },
  coachText: {
    ...typography.body_md,
    color: colors.text_primary,
  },
  replyText: {
    ...typography.body_md,
    color: colors.text_inverse,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
});
