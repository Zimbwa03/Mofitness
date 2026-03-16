import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EventRegistrationForm } from "@/components/events/event-registration-form";
import { getEventBySlug, formatEventDateTime } from "@/lib/platform-data";

export default async function EventDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await getEventBySlug(params.slug);
  if (!event) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{event.event_type}</Badge>
            <Badge className="border-white/10 bg-black/60 text-white">
              {event.is_free ? "Free" : `$${event.price_usd ?? 0}`}
            </Badge>
          </div>
          <h1 className="font-display text-6xl uppercase tracking-[0.08em]">
            {event.title}
          </h1>
          <div className="text-sm uppercase tracking-[0.16em] text-muted">
            {formatEventDateTime(event.starts_at)} · {event.city}, {event.country}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="space-y-5 p-6">
            <p className="text-base leading-8 text-muted">{event.description}</p>
            <div className="grid gap-3 text-sm text-muted sm:grid-cols-2">
              <div>Venue: {event.venue_name || "Mofitness Event"}</div>
              <div>Difficulty: {event.difficulty_level || "All levels"}</div>
              <div>Spots left: {event.spots_remaining ?? "Open"}</div>
              <div>Deadline: {event.registration_deadline ? formatEventDateTime(event.registration_deadline) : "Open"}</div>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <div className="font-display text-4xl uppercase tracking-[0.08em]">
              Register
            </div>
            <EventRegistrationForm event={event} />
          </Card>
        </div>
      </div>
    </main>
  );
}
