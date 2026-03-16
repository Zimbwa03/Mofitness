import Image from "next/image";
import Link from "next/link";

import type { FitnessEventRecord } from "@shared/features/findCoach/shared/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { brandAssets } from "@/lib/brand-assets";
import { formatEventDate } from "@/lib/platform-data";

export function EventCard({ event }: { event: FitnessEventRecord }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-48">
        <Image
          src={event.cover_image_url || brandAssets.coaches.femaleStanding}
          alt={event.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <Badge>{event.event_type}</Badge>
          <Badge className="border-white/10 bg-black/60 text-white">
            {event.is_free ? "Free" : `$${event.price_usd ?? 0}`}
          </Badge>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <div className="font-display text-3xl uppercase tracking-[0.08em]">
            {event.title}
          </div>
          <p className="mt-2 text-sm text-muted">
            {formatEventDate(event.starts_at)} · {event.city}, {event.country}
          </p>
        </div>
        <div className="flex items-center justify-between text-sm text-muted">
          <span>{event.spots_remaining ?? "Open"} spots left</span>
          <span>{event.venue_name || "Mofitness Event"}</span>
        </div>
        <Button asChild className="w-full">
          <Link href={`/events/${event.slug}`}>Register</Link>
        </Button>
      </div>
    </Card>
  );
}
