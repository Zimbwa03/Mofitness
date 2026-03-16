import { AvailabilityEditor } from "@/components/portal/availability-editor";
import { Card } from "@/components/ui/card";
import { requireCoach } from "@/lib/auth/guards";
import { formatEventDateTime, getCoachPortalSchedule } from "@/lib/platform-data";

export default async function CoachPortalSchedulePage() {
  const user = await requireCoach();
  const schedule = await getCoachPortalSchedule(user.id);

  return (
    <div className="space-y-6">
      <AvailabilityEditor initialAvailability={schedule.availability} />

      <Card className="p-6">
        <div className="font-display text-4xl uppercase tracking-[0.08em]">Upcoming Events</div>
        <div className="mt-4 grid gap-3">
          {schedule.events.length > 0 ? (
            schedule.events.map((event) => (
              <Card key={event.id} className="p-4">
                <div className="font-semibold text-white">{event.title}</div>
                <div className="mt-1 text-sm text-muted">
                  {formatEventDateTime(event.starts_at)} · {event.city}, {event.country}
                </div>
              </Card>
            ))
          ) : (
            <div className="text-sm text-muted">No upcoming events linked to your account.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
