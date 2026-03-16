import { ChatWorkspace } from "@/components/portal/chat-workspace";
import { requireCoach } from "@/lib/auth/guards";
import { getCoachPortalSnapshot } from "@/lib/platform-data";

export default async function CoachPortalMessagesPage() {
  const user = await requireCoach();
  const snapshot = await getCoachPortalSnapshot(user.id);

  return <ChatWorkspace initialConversations={snapshot.conversations} />;
}
