import { Card } from "@/components/ui/card";
import { getAdminUsers } from "@/lib/platform-data";

export default async function AdminUsersPage() {
  const snapshot = await getAdminUsers();

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="font-display text-5xl uppercase tracking-[0.08em]">Users</div>
        <div className="mt-3 text-sm text-muted">
          Total users: {snapshot.totalUsers}
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.2fr_1.3fr_0.8fr_0.8fr_1fr] gap-4 border-b border-white/5 px-6 py-4 text-xs uppercase tracking-[0.16em] text-muted">
          <div>Name</div>
          <div>Email</div>
          <div>Onboarding</div>
          <div>Points</div>
          <div>Created</div>
        </div>
        {snapshot.users.map((user) => (
          <div
            key={String((user as { id: string }).id)}
            className="grid grid-cols-[1.2fr_1.3fr_0.8fr_0.8fr_1fr] gap-4 border-b border-white/5 px-6 py-4 text-sm text-muted"
          >
            <div className="text-white">{String((user as { full_name: string }).full_name)}</div>
            <div>{String((user as { email: string }).email)}</div>
            <div>{(user as { onboarding_completed: boolean }).onboarding_completed ? "Yes" : "No"}</div>
            <div>{String((user as { points: number }).points)}</div>
            <div>{new Date(String((user as { created_at: string }).created_at)).toLocaleDateString()}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
