import { AdminEventManager } from "@/components/admin/admin-event-manager";
import { getAdminEvents } from "@/lib/platform-data";

export default async function AdminEventsPage() {
  const events = await getAdminEvents();

  return <AdminEventManager events={events} />;
}
