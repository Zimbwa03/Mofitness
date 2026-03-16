import { Card } from "@/components/ui/card";
import { getAdminOverview } from "@/lib/platform-data";

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <Card className="p-6">Pending Coaches: {overview.pendingCoaches}</Card>
      <Card className="p-6">Approved Coaches: {overview.approvedCoaches}</Card>
      <Card className="p-6">Live Events: {overview.liveEvents}</Card>
      <Card className="p-6">Total Users: {overview.totalUsers}</Card>
    </div>
  );
}
