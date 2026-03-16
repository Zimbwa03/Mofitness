import { getApprovedCoaches } from "@/lib/platform-data";
import { FindCoachExperience } from "@/components/coaches/find-coach-experience";

export default async function FindCoachPage() {
  const coaches = await getApprovedCoaches();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <FindCoachExperience coaches={coaches} />
    </main>
  );
}
