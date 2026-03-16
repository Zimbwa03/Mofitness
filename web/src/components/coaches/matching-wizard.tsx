"use client";

import { useMemo, useState } from "react";

import type { MatchingProfile, MatchingResult } from "@shared/features/findCoach/shared/types";
import {
  calculateBmi,
  calculateBmrMifflinStJeor,
  calculateDailyCalorieTarget,
  calculateIdealWeightRange,
  calculateTdee,
  getBmiCategory,
} from "@shared/features/findCoach/shared/calculations";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type WizardStep = 1 | 2 | 3 | 4 | 5;

type WizardState = MatchingProfile & {
  activityLevel: "sedentary" | "light" | "moderate" | "very_active";
};

type MatchingResultWithCoach = MatchingResult & {
  coach?: {
    id?: string;
    slug?: string;
    full_name?: string;
  } | null;
};

const STEP_TITLES: Record<WizardStep, string> = {
  1: "Your Body Stats",
  2: "Your Goal",
  3: "Fitness Level & Conditions",
  4: "Preferences",
  5: "Your Details",
};

const initialState: WizardState = {
  email: "",
  full_name: "",
  age: 28,
  gender: "female",
  height_cm: 168,
  weight_kg: 72,
  fitness_goal: "weight_loss",
  fitness_level: "light_activity",
  injuries: [],
  preferred_session: "in_person",
  budget_per_session_usd: 50,
  city: "Harare",
  country: "Zimbabwe",
  travel_radius_km: 10,
  send_results_by_email: true,
  notify_new_coaches: true,
  activityLevel: "light",
};

function getBmiMeterPosition(bmi: number | null) {
  if (!bmi) {
    return 0;
  }
  return Math.max(0, Math.min(100, (bmi / 40) * 100));
}

export function MatchingWizard({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<WizardStep>(1);
  const [state, setState] = useState<WizardState>(initialState);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchingResultWithCoach[]>([]);
  const [error, setError] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const bmi = calculateBmi(state.height_cm ?? 0, state.weight_kg ?? 0);
    const bmiCategory = bmi ? getBmiCategory(bmi) : null;
    const bmr = calculateBmrMifflinStJeor({
      gender: state.gender,
      age: state.age,
      heightCm: state.height_cm,
      weightKg: state.weight_kg,
    });
    const tdee = bmr ? calculateTdee(bmr, state.activityLevel) : null;
    const idealWeight = state.height_cm ? calculateIdealWeightRange(state.height_cm) : null;
    const dailyCalories = tdee
      ? calculateDailyCalorieTarget({
          tdee,
          goal: state.fitness_goal,
        })
      : null;

    return { bmi, bmiCategory, bmr, tdee, idealWeight, dailyCalories };
  }, [state]);

  function updateState(partial: Partial<WizardState>) {
    setState((current) => ({ ...current, ...partial }));
  }

  function nextStep() {
    setStep((current) => (current < 5 ? ((current + 1) as WizardStep) : current));
  }

  function previousStep() {
    setStep((current) => (current > 1 ? ((current - 1) as WizardStep) : current));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/matching", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...state,
          bmi: metrics.bmi,
          bmi_category: metrics.bmiCategory,
          bmr: metrics.bmr,
          tdee: metrics.tdee,
          daily_calorie_target: metrics.dailyCalories,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        matches?: MatchingResultWithCoach[];
      };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to match coaches.");
      }

      setResults(payload.matches ?? []);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to match coaches.");
    } finally {
      setLoading(false);
    }
  }

  function renderStepContent() {
    if (step === 1) {
      const meterPosition = getBmiMeterPosition(metrics.bmi);
      return (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="number"
              placeholder="Height (cm)"
              value={state.height_cm ?? ""}
              onChange={(event) => updateState({ height_cm: Number(event.target.value) })}
            />
            <Input
              type="number"
              placeholder="Weight (kg)"
              value={state.weight_kg ?? ""}
              onChange={(event) => updateState({ weight_kg: Number(event.target.value) })}
            />
            <Input
              type="number"
              placeholder="Age"
              value={state.age ?? ""}
              onChange={(event) => updateState({ age: Number(event.target.value) })}
            />
            <Input
              placeholder="Gender (male/female/other)"
              value={state.gender ?? ""}
              onChange={(event) => updateState({ gender: event.target.value })}
            />
          </div>

          <Card className="border-lime/30 bg-lime/10 p-5">
            <div className="font-display text-4xl uppercase text-lime">
              BMI {metrics.bmi?.toFixed(1) ?? "--"}
            </div>
            <div className="text-sm uppercase tracking-[0.16em] text-muted">
              {metrics.bmiCategory ?? "enter your stats"}
            </div>
            <div className="mt-4 rounded-full bg-black/50 p-1">
              <div className="relative h-3 rounded-full bg-gradient-to-r from-blue-500 via-lime to-red-500">
                <div
                  className="absolute -top-1 h-5 w-2 rounded bg-white"
                  style={{ left: `${meterPosition}%`, transform: "translateX(-50%)" }}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-muted">
              <div>BMR: {metrics.bmr ? `${Math.round(metrics.bmr)} kcal` : "--"}</div>
              <div>TDEE: {metrics.tdee ? `${Math.round(metrics.tdee)} kcal` : "--"}</div>
              <div>
                Ideal range: {metrics.idealWeight ? `${metrics.idealWeight.minKg}kg - ${metrics.idealWeight.maxKg}kg` : "--"}
              </div>
              <div>Daily target: {metrics.dailyCalories ? `${metrics.dailyCalories} kcal` : "--"}</div>
            </div>
          </Card>
        </Card>
      );
    }

    if (step === 2) {
      return (
        <Card className="space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "weight_loss",
              "muscle_gain",
              "get_fit",
              "running_endurance",
              "sports_performance",
              "injury_rehabilitation",
              "general_health",
              "body_transformation",
            ].map((goal) => {
              const selected = state.fitness_goal === goal;
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => updateState({ fitness_goal: goal })}
                  className={`rounded-xl border px-4 py-3 text-left text-sm uppercase tracking-[0.12em] ${
                    selected ? "border-lime bg-lime/15 text-white" : "border-white/10 bg-black/40 text-muted"
                  }`}
                >
                  {goal.replace(/_/g, " ")}
                </button>
              );
            })}
          </div>
        </Card>
      );
    }

    if (step === 3) {
      return (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="Fitness level"
              value={state.fitness_level ?? ""}
              onChange={(event) => updateState({ fitness_level: event.target.value })}
            />
            <Input
              placeholder="Activity (sedentary/light/moderate/very_active)"
              value={state.activityLevel}
              onChange={(event) =>
                updateState({
                  activityLevel: (event.target.value as WizardState["activityLevel"]) || "light",
                })
              }
            />
          </div>
          <Textarea
            placeholder="Injuries or conditions (comma separated)"
            value={(state.injuries ?? []).join(", ")}
            onChange={(event) =>
              updateState({
                injuries: event.target.value
                  .split(",")
                  .map((entry) => entry.trim())
                  .filter(Boolean),
              })
            }
          />
        </Card>
      );
    }

    if (step === 4) {
      return (
        <Card className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              placeholder="Preferred session (in_person/virtual/group/any)"
              value={state.preferred_session ?? ""}
              onChange={(event) => updateState({ preferred_session: event.target.value })}
            />
            <Input
              type="number"
              placeholder="Budget per session (USD)"
              value={state.budget_per_session_usd ?? ""}
              onChange={(event) => updateState({ budget_per_session_usd: Number(event.target.value) })}
            />
            <Input
              type="number"
              placeholder="Travel radius (km)"
              value={state.travel_radius_km ?? ""}
              onChange={(event) => updateState({ travel_radius_km: Number(event.target.value) })}
            />
          </div>
        </Card>
      );
    }

    return (
      <Card className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            placeholder="Full name"
            value={state.full_name ?? ""}
            onChange={(event) => updateState({ full_name: event.target.value })}
          />
          <Input
            placeholder="Email"
            value={state.email}
            onChange={(event) => updateState({ email: event.target.value })}
          />
          <Input
            placeholder="City"
            value={state.city ?? ""}
            onChange={(event) => updateState({ city: event.target.value })}
          />
          <Input
            placeholder="Country"
            value={state.country ?? ""}
            onChange={(event) => updateState({ country: event.target.value })}
          />
          <Input
            type="number"
            placeholder="Location latitude"
            value={state.location_lat ?? ""}
            onChange={(event) => updateState({ location_lat: Number(event.target.value) })}
          />
          <Input
            type="number"
            placeholder="Location longitude"
            value={state.location_lng ?? ""}
            onChange={(event) => updateState({ location_lng: Number(event.target.value) })}
          />
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-muted">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(state.send_results_by_email)}
              onChange={(event) => updateState({ send_results_by_email: event.target.checked })}
            />
            Send match results by email
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(state.notify_new_coaches)}
              onChange={(event) => updateState({ notify_new_coaches: event.target.checked })}
            />
            Notify me when new coaches join nearby
          </label>
        </div>
      </Card>
    );
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/90 p-4">
      <div className="mx-auto max-w-5xl space-y-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.24em] text-lime">
              Let&apos;s find your perfect coach
            </div>
            <h2 className="font-display text-5xl uppercase tracking-[0.08em]">
              Step {step} of 5 - {STEP_TITLES[step]}
            </h2>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="h-2 rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-lime transition-all"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {renderStepContent()}

        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={previousStep} disabled={step === 1 || loading}>
            Back
          </Button>
          {step < 5 ? (
            <Button onClick={nextStep} disabled={loading}>
              Next
            </Button>
          ) : (
            <Button onClick={() => void handleSubmit()} disabled={loading}>
              {loading ? "Finding coaches..." : "Find Matches"}
            </Button>
          )}
        </div>

        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        {results.length > 0 ? (
          <div className="grid gap-4">
            {results.map((result, index) => (
              <Card key={result.coach_id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-lime">
                      Match #{index + 1}
                    </div>
                    <div className="mt-2 font-display text-4xl uppercase tracking-[0.08em]">
                      {result.match_score}% match
                    </div>
                  </div>
                  <Button variant="ghost" asChild>
                    <a href={result.coach?.slug ? `/coach/${result.coach.slug}` : "/find-a-coach"}>
                      {result.coach?.full_name ? `View ${result.coach.full_name}` : "View Coach"}
                    </a>
                  </Button>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-muted">
                  {result.reasons.map((reason) => (
                    <div key={reason}>✓ {reason}</div>
                  ))}
                  {result.concern ? <div>Concern: {result.concern}</div> : null}
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
