import { Card } from "@/components/ui/card";
import { requireCoach } from "@/lib/auth/guards";
import { getCoachPortalClients } from "@/lib/platform-data";

export default async function CoachPortalClientsPage() {
  const user = await requireCoach();
  const clients = await getCoachPortalClients(user.id);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="font-display text-5xl uppercase tracking-[0.08em]">Clients</div>
        <div className="mt-3 text-sm text-muted">
          Active, contacted, and completed client matches from web + mobile.
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1fr_0.7fr_0.8fr_1fr] gap-4 border-b border-white/5 px-6 py-4 text-xs uppercase tracking-[0.16em] text-muted">
          <div>Client</div>
          <div>Email</div>
          <div>Source</div>
          <div>Score</div>
          <div>Status</div>
        </div>
        {clients.length > 0 ? (
          clients.map((client) => (
            <div
              key={client.id}
              className="grid grid-cols-[1.2fr_1fr_0.7fr_0.8fr_1fr] gap-4 border-b border-white/5 px-6 py-4 text-sm text-muted"
            >
              <div className="text-white">{client.name}</div>
              <div>{client.email}</div>
              <div className="uppercase">{client.source}</div>
              <div>{client.match_score ? `${Math.round(client.match_score)}%` : "--"}</div>
              <div className="uppercase">{client.status.replace(/_/g, " ")}</div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-sm text-muted">
            No client matches yet. Once users run matching or contact you, they appear here.
          </div>
        )}
      </Card>
    </div>
  );
}
