"use client";

import { useMemo, useState } from "react";

import type { CoachRecord } from "@shared/features/findCoach/shared/types";
import { applyCoachFilters } from "@shared/features/findCoach/shared/filters";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CoachCard } from "./coach-card";
import { LiveCoachMap } from "./live-coach-map";
import { MatchingWizard } from "./matching-wizard";

export function FindCoachExperience({ coaches }: { coaches: CoachRecord[] }) {
  const [search, setSearch] = useState("");
  const [selectedSpecialisation, setSelectedSpecialisation] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [maxPrice, setMaxPrice] = useState(200);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(
    coaches[0]?.id ?? null,
  );
  const [wizardOpen, setWizardOpen] = useState(false);

  const filtered = useMemo(
    () =>
      applyCoachFilters(coaches, {
        search,
        specialisations: selectedSpecialisation ? [selectedSpecialisation] : [],
        sessionTypes: selectedSession ? [selectedSession] : [],
        maxPriceUsd: maxPrice,
        radiusKm,
        sort: "nearest",
      }),
    [coaches, maxPrice, radiusKm, search, selectedSession, selectedSpecialisation],
  );

  const selectedCoach =
    filtered.find((entry) => entry.coach.id === selectedCoachId)?.coach ??
    filtered[0]?.coach ??
    null;

  return (
    <>
      <div className="grid min-h-[calc(100vh-160px)] gap-6 lg:grid-cols-[0.42fr_0.58fr]">
        <Card className="space-y-6 p-6">
          <div>
            <div className="font-display text-5xl uppercase tracking-[0.08em]">
              Find A Coach
            </div>
            <p className="mt-3 text-sm leading-7 text-muted">
              Verified fitness professionals near you. Filter by goal, format,
              and price, then run the matching wizard when you want a tighter fit.
            </p>
          </div>

          <Card className="bg-lime/10 p-5">
            <div className="text-sm uppercase tracking-[0.18em] text-lime">
              Get matched to the right coach
            </div>
            <p className="mt-2 text-sm text-muted">
              Tell us about your goal and we will calculate your stats and rank
              nearby coaches for you.
            </p>
            <div className="mt-4">
              <Button onClick={() => setWizardOpen(true)}>Start Matching</Button>
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Search by name or keyword"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Input
              placeholder="Specialisation"
              value={selectedSpecialisation}
              onChange={(event) => setSelectedSpecialisation(event.target.value)}
            />
            <Input
              placeholder="Session type"
              value={selectedSession}
              onChange={(event) => setSelectedSession(event.target.value)}
            />
            <Input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
            />
          </div>

          <div className="text-sm uppercase tracking-[0.16em] text-muted">
            {filtered.length} verified coaches available
          </div>

          <div className="grid gap-4">
            {filtered.map((entry) => (
              <button
                key={entry.coach.id}
                type="button"
                className="text-left"
                onClick={() => setSelectedCoachId(entry.coach.id)}
              >
                <CoachCard
                  coach={entry.coach}
                  distanceKm={entry.distanceKm}
                />
              </button>
            ))}
          </div>
        </Card>

        <div className="relative overflow-hidden">
          <LiveCoachMap
            coaches={filtered}
            selectedCoachId={selectedCoachId}
            radiusKm={radiusKm}
            onSelectCoach={setSelectedCoachId}
            onRadiusChange={setRadiusKm}
          />
          {selectedCoach ? (
            <Card className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-md border-white/10 bg-black/75 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.18em] text-lime">
                Selected Coach
              </div>
              <div className="mt-2 font-display text-3xl uppercase tracking-[0.08em]">
                {selectedCoach.full_name}
              </div>
              <div className="mt-1 text-sm text-muted">
                {selectedCoach.city}, {selectedCoach.country}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      <MatchingWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  );
}
