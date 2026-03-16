import { EventCard } from "@/components/events/event-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { getPublishedEvents } from "@/lib/platform-data";

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionHeading
        label="Mofitness Events"
        title="Real Events. Real Community. Real Results."
        description="Admin-managed events go live here and support both free registration and Stripe-powered paid tickets."
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </main>
  );
}
