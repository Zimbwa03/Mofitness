import type { UserProfile } from "../../../models";
import { BaseAIService } from "../../../services/ai/BaseAIService";
import type { ErrorHistory, ExerciseConfig, FormCoachResponse, RepHistory } from "../types";

const FormCoachSchema = {
  type: "object",
  properties: {
    primary_issue: { type: "string", nullable: true },
    secondary_issue: { type: "string", nullable: true },
    positive_note: { type: "string", nullable: true },
    tempo_feedback: { type: "string", nullable: true },
    drill_suggestion: { type: "string", nullable: true },
    spoken_summary: { type: "string" },
    overall_rating: { type: "string", enum: ["excellent", "good", "needs_work", "poor"] },
  },
};

const FORM_COACH_SYSTEM_INSTRUCTION = `
You are Mo, an elite strength and conditioning coach.
Be precise, direct, and biomechanically correct.
Reference actual numbers from the workout data.
Keep the final spoken summary to three sentences or fewer.
`;

class VertexFormCoach extends BaseAIService {
  async analyzeFormSession(
    exercise: ExerciseConfig,
    repHistory: RepHistory[],
    errorHistory: ErrorHistory[],
    sessionScore: number,
    userProfile: UserProfile | null,
  ): Promise<FormCoachResponse> {
    const prompt = this.buildFormPrompt(exercise, repHistory, errorHistory, sessionScore, userProfile);
    const response = await this.generateWithCache<FormCoachResponse>({
      feature: "form_coach",
      userId: userProfile?.id ?? "local-form-coach",
      prompt,
      systemInstruction: FORM_COACH_SYSTEM_INSTRUCTION,
      schema: FormCoachSchema,
    });

    return response.structuredData ?? this.buildFallback(exercise, repHistory, errorHistory, sessionScore);
  }

  private buildFormPrompt(
    exercise: ExerciseConfig,
    repHistory: RepHistory[],
    errorHistory: ErrorHistory[],
    sessionScore: number,
    user: UserProfile | null,
  ) {
    return `
Analyze this exercise session and provide precise coaching feedback.

EXERCISE: ${exercise.name}
ATHLETE: ${user?.experience_level ?? "beginner"} level, ${user?.weight_kg ?? "unknown"}kg

SESSION DATA (last ${repHistory.length} reps):
${repHistory
  .map(
    (rep) =>
      `Rep ${rep.repNumber}: score=${rep.formScore}%, angle=${rep.primaryAngle.toFixed(1)}deg, eccentric=${rep.eccentricMs}ms, concentric=${rep.concentricMs}ms`,
  )
  .join("\n")}

FORM ERRORS DETECTED:
${errorHistory.map((error) => `- ${error.id}: ${error.count} times, avg duration ${error.avgDurationMs}ms, phase ${error.mostCommonPhase}`).join("\n") || "No errors detected"}

OVERALL SESSION SCORE: ${sessionScore}%
Return two to three sentences maximum.
`;
  }

  private buildFallback(
    exercise: ExerciseConfig,
    repHistory: RepHistory[],
    errorHistory: ErrorHistory[],
    sessionScore: number,
  ): FormCoachResponse {
    const [primary, secondary] = [...errorHistory].sort((a, b) => {
      const severityRank = { critical: 3, warning: 2, info: 1 };
      if (severityRank[b.severity] !== severityRank[a.severity]) {
        return severityRank[b.severity] - severityRank[a.severity];
      }
      return b.count - a.count;
    });

    const eccentricAverage =
      repHistory.length > 0
        ? Math.round(repHistory.reduce((sum, rep) => sum + rep.eccentricMs, 0) / repHistory.length)
        : 0;

    const positive =
      sessionScore > 80
        ? `${exercise.name} stayed solid overall at ${sessionScore} percent with cleaner reps late in the set.`
        : null;
    const primaryIssue = primary ? `${primary.cue} showed up ${primary.count} times.` : "No major fault pattern stood out.";
    const secondaryIssue = secondary ? `${secondary.cue} was the next limiter.` : null;
    const tempoFeedback =
      eccentricAverage > 0
        ? `Average lowering tempo was ${eccentricAverage} milliseconds, which ${eccentricAverage >= 1800 ? "shows control." : "could be slower for cleaner reps."}`
        : "Tempo data is limited in this session.";
    const drill = primary ? primary.fix : "Keep filming from the same angle to build comparable history.";
    const spokenSummary = [positive, primaryIssue, tempoFeedback].filter(Boolean).join(" ");

    return {
      primary_issue: primaryIssue,
      secondary_issue: secondaryIssue,
      positive_note: positive,
      tempo_feedback: tempoFeedback,
      drill_suggestion: drill,
      spoken_summary: spokenSummary,
      overall_rating: sessionScore >= 85 ? "excellent" : sessionScore >= 70 ? "good" : sessionScore >= 55 ? "needs_work" : "poor",
    };
  }
}

const vertexFormCoach = new VertexFormCoach();

export default vertexFormCoach;
