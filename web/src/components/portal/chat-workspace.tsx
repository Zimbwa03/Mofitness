"use client";

import { useEffect, useState } from "react";

import type { ConversationRecord, MessageRecord } from "@shared/features/findCoach/shared/types";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ChatWorkspace({
  initialConversations,
}: {
  initialConversations: ConversationRecord[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  );
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    fetch(`/api/chat?conversationId=${activeConversationId}`)
      .then((response) => response.json())
      .then((payload: { messages?: MessageRecord[] }) => {
        setMessages(payload.messages ?? []);
      })
      .catch(() => undefined);
  }, [activeConversationId]);

  async function sendMessage() {
    if (!activeConversationId || !draft.trim()) {
      return;
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: activeConversationId,
        body: draft,
      }),
    });

    const payload = (await response.json()) as { message?: MessageRecord };
    if (payload.message) {
      setMessages((current) => [...current, payload.message as MessageRecord]);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversationId
            ? {
                ...conversation,
                last_message: payload.message?.body ?? conversation.last_message,
              }
            : conversation,
        ),
      );
      setDraft("");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.36fr_0.64fr]">
      <Card className="p-6">
        <div className="font-display text-4xl uppercase tracking-[0.08em]">
          Conversations
        </div>
        <div className="mt-5 grid gap-3">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              className="rounded-2xl border border-white/5 bg-black/30 p-4 text-left text-sm text-muted transition hover:border-lime"
              onClick={() => setActiveConversationId(conversation.id)}
            >
              <div className="text-white">{conversation.last_message || "Open thread"}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.16em]">
                {conversation.id}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card className="flex min-h-[520px] flex-col p-6">
        <div className="font-display text-4xl uppercase tracking-[0.08em]">
          Messages
        </div>
        <div className="mt-5 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/5 bg-black/20 p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                message.sender_type === "coach"
                  ? "bg-lime text-black"
                  : "bg-white/5 text-white"
              }`}
            >
              {message.body}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <Input
            placeholder="Type a message..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button onClick={() => void sendMessage()}>Send</Button>
        </div>
      </Card>
    </div>
  );
}
