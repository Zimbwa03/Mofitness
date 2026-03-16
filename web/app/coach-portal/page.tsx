import { Card } from "@/components/ui/card";
import { requireCoach } from "@/lib/auth/guards";
import { getCoachPortalSnapshot } from "@/lib/platform-data";

export default async function CoachPortalHomePage() {
  const user = await requireCoach();
  const snapshot = await getCoachPortalSnapshot(user.id);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <div className="font-display text-5xl uppercase tracking-[0.08em]">
          Welcome Back
        </div>
        <div className="mt-3 text-sm uppercase tracking-[0.16em] text-lime">
          {snapshot.coach?.status === "approved" ? "Verified Coach" : "Application In Progress"}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Card className="p-4">Profile Views This Month: 247</Card>
          <Card className="p-4">Active Enquiries: {snapshot.conversations.length}</Card>
          <Card className="p-4">Clients This Month: {snapshot.coach?.total_clients ?? 0}</Card>
          <Card className="p-4">Profile Completeness: 92%</Card>
        </div>
      </Card>
      <Card className="p-6">
        <div className="font-display text-4xl uppercase tracking-[0.08em]">
          Status
        </div>
        <div className="mt-4 text-sm text-muted">
          {snapshot.coach?.status || "Draft"}
        </div>
      </Card>
    </div>
  );
}
