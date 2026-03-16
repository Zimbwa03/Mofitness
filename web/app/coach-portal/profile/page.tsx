import { CoachProfileEditor } from "@/components/portal/coach-profile-editor";
import { Card } from "@/components/ui/card";
import { requireCoach } from "@/lib/auth/guards";
import { getCoachPortalSnapshot } from "@/lib/platform-data";

export default async function CoachPortalProfilePage() {
  const user = await requireCoach();
  const { coach } = await getCoachPortalSnapshot(user.id);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="font-display text-5xl uppercase tracking-[0.08em]">
          My Profile
        </div>
        <div className="mt-3 text-sm text-muted">
          Keep your profile complete so matching and public visibility stay strong.
        </div>
      </Card>
      <CoachProfileEditor coach={coach} />
    </div>
  );
}
