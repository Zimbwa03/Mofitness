import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MapPin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { brandAssets } from "@/lib/brand-assets";
import { getCoachBySlug } from "@/lib/platform-data";

export default async function CoachDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { coach, reviews, certifications } = await getCoachBySlug(params.slug);

  if (!coach) {
    notFound();
  }

  return (
    <main className="pb-20">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,241,53,0.18),transparent_32%),linear-gradient(180deg,#161616,#0A0A0A)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div className="space-y-6">
            <Badge className="bg-green-500/15 text-green-200">
              <Check className="mr-2 h-3 w-3" />
              Mofitness Verified
            </Badge>
            <div>
              <h1 className="font-display text-7xl uppercase leading-none tracking-[0.08em]">
                {coach.full_name}
              </h1>
              <div className="mt-3 text-lg text-muted">
                {coach.tagline || "Verified fitness professional"}
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm uppercase tracking-[0.16em] text-muted">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-lime" />
                  {coach.city}, {coach.country}
                </span>
                <span className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-current text-lime" />
                  {Number(coach.avg_rating ?? 0).toFixed(1)} ({coach.total_reviews ?? 0} reviews)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(coach.specialisations ?? []).map((item) => (
                <Badge key={item}>{item.replace(/_/g, " ")}</Badge>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-8 rounded-full bg-lime/20 blur-3xl" />
            <Image
              src={coach.profile_photo_url || brandAssets.coaches.maleStanding}
              alt={coach.full_name}
              className="relative mx-auto h-auto max-h-[520px] w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="space-y-8">
          <Card className="p-6">
            <div className="font-display text-4xl uppercase tracking-[0.08em]">
              About
            </div>
            <p className="mt-4 text-base leading-8 text-muted">{coach.bio}</p>
            <div className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-2">
              <div>{coach.experience_years} years experience</div>
              <div>{coach.total_clients} clients</div>
              <div>{coach.response_rate_pct}% response rate</div>
              <div>${coach.price_per_hour_usd ?? 0}/session</div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-display text-4xl uppercase tracking-[0.08em]">
              Certifications
            </div>
            <div className="mt-5 grid gap-3">
              {certifications.length > 0 ? (
                certifications.map((certification) => (
                  <div
                    key={String((certification as { id: string }).id)}
                    className="rounded-2xl border border-white/5 bg-black/30 p-4 text-sm text-muted"
                  >
                    <div className="font-semibold text-white">
                      {(certification as { certification_name?: string }).certification_name || "Certification"}
                    </div>
                    <div>
                      {(certification as { issuing_organisation?: string }).issuing_organisation || "Issuing organisation"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted">Certification details will appear here after review.</div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="font-display text-4xl uppercase tracking-[0.08em]">
              Reviews
            </div>
            <div className="mt-5 grid gap-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div
                    key={String((review as { id: string }).id)}
                    className="rounded-2xl border border-white/5 bg-black/30 p-4"
                  >
                    <div className="text-sm text-lime">
                      {"★".repeat(Number((review as { rating?: number }).rating ?? 5))}
                    </div>
                    <div className="mt-2 text-sm text-muted">
                      {(review as { body?: string }).body || "Strong experience working with this coach."}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted">Reviews will appear once matched clients leave feedback.</div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="font-display text-4xl uppercase tracking-[0.08em]">
              Contact
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted">
              <div>Session types: {(coach.session_types ?? []).join(", ")}</div>
              <div>Languages: {(coach.languages ?? []).join(", ") || "English"}</div>
              <div>Travels up to {coach.radius_km}km</div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href={`/find-a-coach?coach=${coach.id}`}>Message This Coach</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/find-a-coach">Back To Search</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
