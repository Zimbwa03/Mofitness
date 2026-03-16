import { AdminCoachTable } from "@/components/admin/admin-coach-table";
import { getAdminCoachApplications, getCoachCountsByStatus } from "@/lib/platform-data";

export default async function AdminCoachesPage() {
  const [coaches, counts] = await Promise.all([
    getAdminCoachApplications(),
    getCoachCountsByStatus(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 text-sm uppercase tracking-[0.16em] text-muted">
        <span>Pending ({counts.pending})</span>
        <span>Under Review ({counts.under_review})</span>
        <span>Approved ({counts.approved})</span>
        <span>Rejected ({counts.rejected})</span>
      </div>
      <AdminCoachTable coaches={coaches} />
    </div>
  );
}
