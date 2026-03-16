import { Card } from "@/components/ui/card";
import { requireCoach } from "@/lib/auth/guards";
import { getCoachPortalEarnings } from "@/lib/platform-data";

export default async function CoachPortalEarningsPage() {
  const user = await requireCoach();
  const earnings = await getCoachPortalEarnings(user.id);

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <Card className="p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-muted">Hourly Rate</div>
        <div className="mt-2 font-display text-5xl uppercase text-lime">${earnings.hourlyRate}</div>
      </Card>
      <Card className="p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-muted">Active Clients</div>
        <div className="mt-2 font-display text-5xl uppercase">{earnings.activeClients}</div>
      </Card>
      <Card className="p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-muted">Completed Clients</div>
        <div className="mt-2 font-display text-5xl uppercase">{earnings.completedClients}</div>
      </Card>
      <Card className="p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-muted">Contacted Leads</div>
        <div className="mt-2 font-display text-5xl uppercase">{earnings.contactedLeads}</div>
      </Card>
      <Card className="p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-muted">Estimated Monthly Revenue</div>
        <div className="mt-2 font-display text-5xl uppercase text-lime">${earnings.estimatedMonthlyRevenue}</div>
      </Card>
      <Card className="p-6">
        <div className="text-xs uppercase tracking-[0.16em] text-muted">Response Rate</div>
        <div className="mt-2 font-display text-5xl uppercase">{earnings.responseRatePct}%</div>
      </Card>
    </div>
  );
}
