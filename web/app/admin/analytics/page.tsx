import { Card } from "@/components/ui/card";
import { getAdminAnalytics } from "@/lib/platform-data";

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics();

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
      <Card className="p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-muted">Conversations</div>
        <div className="mt-2 font-display text-5xl uppercase">{analytics.totalConversations}</div>
      </Card>
      <Card className="p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-muted">Messages (30d)</div>
        <div className="mt-2 font-display text-5xl uppercase">{analytics.messages30d}</div>
      </Card>
      <Card className="p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-muted">Matches (30d)</div>
        <div className="mt-2 font-display text-5xl uppercase">{analytics.matches30d}</div>
      </Card>
      <Card className="p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-muted">Event Registrations (30d)</div>
        <div className="mt-2 font-display text-5xl uppercase">{analytics.eventRegistrations30d}</div>
      </Card>
      <Card className="p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-muted">Push Sent (30d)</div>
        <div className="mt-2 font-display text-5xl uppercase text-lime">{analytics.pushSent30d}</div>
      </Card>
    </div>
  );
}
