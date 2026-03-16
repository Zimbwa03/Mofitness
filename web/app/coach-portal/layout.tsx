import { requireCoach } from "@/lib/auth/guards";
import { PortalNav } from "@/components/portal/portal-nav";

export default async function CoachPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCoach();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PortalNav activePath="/coach-portal" />
      <div className="mt-8">{children}</div>
    </main>
  );
}
