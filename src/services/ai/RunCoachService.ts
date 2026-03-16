import type { NutritionGoal, RunConfig, RunSession, UserProfile, WellnessLog } from "../../models";
import { BaseAIService } from "./BaseAIService";

export interface PreRunBriefing {
  warmupSuggestion: string;
  targetPace: string;
  motivation: string;
}

export interface PaceAlertData {
  paceDiffSec?: number;
  bpm?: number;
  targetPace?: number;
}

export interface RunAnalysis {
  headline: string;
  highlights: string[];
  nextRunRecommendation: string;
  goalImpact: string;
}

export interface WeeklyRunPlan {
  title: string;
  sessions: Array<{ day: string; focus: string; distanceKm: number; effort: string }>;
}

export const RUN_COACH_SYSTEM_INSTRUCTION = `
You are Mo, an elite running coach and sports scientist.
Rules:
- Maximum 2 sentences per coaching cue.
- Be data-aware and specific.
- Prioritize safety if heart rate is high.
- Keep tone motivating and direct.
`;

const COACH_TEMPLATES = {
  start: ["Let's go. Settle in for the first minute and find rhythm."],
  halfway: ["Halfway. Stay smooth and hold your cadence."],
  final_500m: ["Final 500m. Drive your knees and finish strong."],
  finish: ["Run complete. Strong execution from start to finish."],
} as const;

class RunCoachService extends BaseAIService {
  async getPreRunBriefing(
    user: UserProfile,
    runConfig: RunConfig,
    _recentTraining: RunSession[],
    _wellnessLog: WellnessLog | null,
  ): Promise<PreRunBriefing> {
    const targetPace = runConfig.target.paceSecPerKm
      ? `${Math.floor(runConfig.target.paceSecPerKm / 60)}:${String(runConfig.target.paceSecPerKm % 60).padStart(2, "0")}/km`
      : "easy conversational pace";

    return {
      warmupSuggestion: runConfig.warmupEnabled ? "5-minute brisk walk plus ankle mobility." : "60-second easy jog and breathe in.",
      targetPace,
      motivation: `${user.full_name?.split(" ")[0] ?? "Athlete"}, smooth first kilometer, then build gradually.`,
    };
  }

  async getKmMilestoneMessage(data: {
    km: number;
    splitTime: number;
    avgPace: number;
    targetPace: number;
    remainingDistance: number;
    heartRate: number;
  }): Promise<string> {
    const paceDiff = data.avgPace - data.targetPace;
    const paceNote =
      paceDiff > 20 ? "A touch behind target; quicken slightly." : paceDiff < -20 ? "You are ahead of target, stay controlled." : "Right on target.";
    const paceText = `${Math.floor(data.avgPace / 60)}:${String(Math.round(data.avgPace % 60)).padStart(2, "0")}/km`;
    return `${data.km}km done at ${paceText}. ${paceNote}`;
  }

  async getPaceAlertMessage(
    alertType: "pace_too_slow" | "pace_too_fast" | "hr_too_high",
    data: PaceAlertData,
  ): Promise<string> {
    if (alertType === "hr_too_high") {
      return `Heart rate at ${data.bpm ?? "--"} bpm. Ease up for 60 seconds and control breathing.`;
    }

    if (alertType === "pace_too_fast") {
      return `You are ${Math.round(Math.abs(data.paceDiffSec ?? 0))} sec/km too fast. Back off slightly and save your kick.`;
    }

    return `You are ${Math.round(data.paceDiffSec ?? 0)} sec/km behind target. Shorten stride and lift cadence.`;
  }

  async analyzeCompletedRun(session: RunSession, _userHistory: RunSession[], userGoal: NutritionGoal): Promise<RunAnalysis> {
    const distanceKm = (session.distance_meters ?? 0) / 1000;
    const pace = session.avg_pace_sec_per_km ?? 0;
    const paceText = pace ? `${Math.floor(pace / 60)}:${String(Math.round(pace % 60)).padStart(2, "0")}/km` : "n/a";

    const prompt = `Distance ${distanceKm.toFixed(2)}km, pace ${paceText}, calories ${session.calories_burned ?? 0}, goal ${userGoal.goal_type}.`;
    const ai = await this.generateWithCache<{ headline: string; highlights: string[]; nextRunRecommendation: string; goalImpact: string }>({
      feature: "run_post_analysis",
      userId: session.user_id,
      prompt,
      systemInstruction: RUN_COACH_SYSTEM_INSTRUCTION,
      schema: {
        type: "object",
        properties: {
          headline: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
          nextRunRecommendation: { type: "string" },
          goalImpact: { type: "string" },
        },
        required: ["headline", "highlights", "nextRunRecommendation", "goalImpact"],
      },
    });

    return (
      ai.structuredData ?? {
        headline: "Strong aerobic session with controlled effort.",
        highlights: [
          `Distance: ${distanceKm.toFixed(2)}km`,
          `Average pace: ${paceText}`,
          `Calories: ${session.calories_burned ?? 0}`,
        ],
        nextRunRecommendation: "Add 500m next session and keep the first 2km easy.",
        goalImpact: "Improved cardiovascular efficiency supports steady goal progress.",
      }
    );
  }

  async generateWeeklyRunPlan(
    _user: UserProfile,
    weeklyKmTarget: number,
    currentFitnessLevel: string,
    goal: string,
  ): Promise<WeeklyRunPlan> {
    const easy = Math.max(3, Math.round(weeklyKmTarget * 0.3));
    const long = Math.max(5, Math.round(weeklyKmTarget * 0.4));
    const quality = Math.max(2, Math.round(weeklyKmTarget * 0.2));

    return {
      title: `${currentFitnessLevel} ${goal} plan`,
      sessions: [
        { day: "Tue", focus: "Easy run", distanceKm: easy, effort: "easy" },
        { day: "Thu", focus: "Intervals", distanceKm: quality, effort: "hard" },
        { day: "Sat", focus: "Long run", distanceKm: long, effort: "steady" },
      ],
    };
  }

  getStartMessage() {
    return COACH_TEMPLATES.start[0];
  }
}

const runCoachService = new RunCoachService();

export default runCoachService;
