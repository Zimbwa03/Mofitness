import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, Star } from "lucide-react";

import { CoachCard } from "@/components/coaches/coach-card";
import { EventCard } from "@/components/events/event-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { brandAssets } from "@/lib/brand-assets";
import {
  getApprovedCoaches,
  getPublishedEvents,
  marketingFeatures,
  testimonials,
} from "@/lib/platform-data";

export default async function HomePage() {
  const [coaches, events] = await Promise.all([
    getApprovedCoaches(),
    getPublishedEvents(),
  ]);

  return (
    <main>
      <section className="dot-grid overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-16 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="text-sm uppercase tracking-[0.28em] text-lime">
                Africa&apos;s AI fitness platform
              </div>
              <h1 className="font-display text-7xl uppercase leading-[0.9] tracking-[0.08em] sm:text-8xl lg:text-[7rem]">
                Mofitness
                <br />
                Built For
                <br />
                <span className="text-lime">Your Grind.</span>
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted">
                Personal coaching, live fitness events, smarter coach matching,
                and one shared network across web and mobile.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/app">
                  <Download className="mr-2 h-5 w-5" />
                  Download Free App
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/find-a-coach">Find A Coach Near You</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 text-sm uppercase tracking-[0.18em] text-muted">
              <span>50,000+ active users</span>
              <span>4.9 app store rating</span>
              <span>Verified coach network</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-x-8 top-10 h-[70%] rounded-full bg-lime/20 blur-3xl" />
            <Image
              src={brandAssets.coaches.maleStanding}
              alt="Mofitness coach"
              className="relative mx-auto h-auto max-h-[760px] w-full object-contain"
              priority
            />
            <Card className="absolute left-0 top-12 max-w-[180px] p-4">
              <div className="text-3xl font-display uppercase text-white">50,000+</div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted">
                Active Users
              </div>
            </Card>
            <Card className="absolute bottom-10 right-0 max-w-[180px] p-4">
              <div className="flex items-center gap-2 text-3xl font-display uppercase text-lime">
                <Star className="h-5 w-5 fill-current" />
                4.9
              </div>
              <div className="text-xs uppercase tracking-[0.16em] text-muted">
                App Store
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          label="Verified Coaches On Mofitness"
          title="Real Coaches. One Network."
          description="Approved coaches surface here first, then appear in the mobile app's Find A Coach experience on the same backend."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {coaches.slice(0, 6).map((coach) => (
            <CoachCard key={coach.id} coach={coach} compact />
          ))}
        </div>
        <div className="mt-8">
          <Button asChild>
            <Link href="/find-a-coach">
              Find Your Coach
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          title="The App That Trains Like A Human"
          description="One product system. Same coach energy, same dark palette, same lime accents across every surface."
          align="center"
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {marketingFeatures.map((feature) => (
            <Card key={feature.title} className="lime-accent p-6 pl-8">
              <div className="font-display text-3xl uppercase tracking-[0.08em]">
                {feature.title}
              </div>
              <p className="mt-3 text-sm leading-7 text-muted">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          title="Events Near You"
          description="Real fitness events. Real community. Real momentum."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {events.slice(0, 3).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
        <div className="mt-8">
          <Button asChild variant="ghost">
            <Link href="/events">View All Events</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="relative">
          <div className="absolute inset-8 rounded-full bg-lime/20 blur-3xl" />
          <Image
            src={brandAssets.coaches.femaleStanding}
            alt="Female Mofitness coach"
            className="relative mx-auto h-auto max-h-[680px] w-full object-contain"
          />
        </div>
        <Card className="bg-lime/8 p-8">
          <SectionHeading
            title="Find Your Perfect Coach"
            description="Answer a few quick questions, calculate your BMI, and get matched to verified coaches who fit your goal, budget, and location."
          />
          <div className="mt-6 space-y-3 text-sm text-muted">
            <div>Verified BMI and goal-based matching</div>
            <div>Verified certifications and identity review</div>
            <div>Coaches near you on a live map</div>
          </div>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/find-a-coach">Find My Coach Now</Link>
            </Button>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Card className="p-8">
          <SectionHeading
            title="Are You A Certified Fitness Coach?"
            description="Join the Mofitness network, get verified, and build your coaching business online."
          />
          <div className="mt-8 grid gap-4 rounded-2xl border border-white/5 bg-black/40 p-4 md:grid-cols-3">
            <div className="text-center">
              <div className="font-display text-4xl uppercase text-lime">100+</div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Coaches</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl uppercase text-lime">50K+</div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted">Users</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl uppercase text-lime">Free</div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted">To Join</div>
            </div>
          </div>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/register-as-coach">Register As A Coach</Link>
            </Button>
          </div>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading title="Trusted By The Grind" align="center" />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.name} className="p-6">
              <div className="text-sm leading-7 text-muted">"{item.quote}"</div>
              <div className="mt-5 font-display text-3xl uppercase tracking-[0.08em]">
                {item.name}
              </div>
              <div className="text-xs uppercase tracking-[0.18em] text-lime">
                {item.country}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
