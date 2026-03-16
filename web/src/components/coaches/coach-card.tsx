import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import type { CoachRecord } from "@shared/features/findCoach/shared/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { brandAssets } from "@/lib/brand-assets";

export function CoachCard({
  coach,
  distanceKm,
  compact = false,
}: {
  coach: Partial<CoachRecord> & { id: string; slug: string; full_name: string; city: string; country: string };
  distanceKm?: number | null;
  compact?: boolean;
}) {
  return (
    <Card className="overflow-hidden p-4">
      <div className="flex gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-lime/70 bg-lime/10">
          <Image
            src={coach.profile_photo_url || brandAssets.coaches.maleChat}
            alt={coach.full_name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-display text-3xl uppercase tracking-[0.08em]">
                {coach.full_name}
              </div>
              <div className="text-sm text-muted">
                {coach.tagline || "Verified Mofitness coach"}
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-lime">
              <Star className="h-4 w-4 fill-current" />
              <span>{Number(coach.avg_rating ?? 4.8).toFixed(1)}</span>
              <span className="text-muted">({coach.total_reviews ?? 0})</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.12em] text-muted">
            <span>
              {coach.city}, {coach.country}
            </span>
            {typeof distanceKm === "number" ? <span>{distanceKm.toFixed(1)} km away</span> : null}
            {coach.price_per_hour_usd ? <span>${coach.price_per_hour_usd}/hr</span> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {(coach.specialisations ?? []).slice(0, compact ? 2 : 3).map((item) => (
              <Badge key={item}>{item.replace(/_/g, " ")}</Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href={`/coach/${coach.slug}`}>View Profile</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/find-a-coach?coach=${coach.id}`}>Message Coach</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
