const mockGenerateContent = jest.fn();

type QueryResult = { data: unknown; error: unknown };
type QueryBuilder = {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  gt: jest.Mock;
  upsert: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  then: Promise<QueryResult>["then"];
  catch: Promise<QueryResult>["catch"];
  finally: Promise<QueryResult>["finally"];
};

const createQueryBuilder = (result: QueryResult): QueryBuilder => {
  const promise = Promise.resolve(result);
  const builder = {} as QueryBuilder;

  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.limit = jest.fn(async () => result);
  builder.single = jest.fn(async () => result);
  builder.maybeSingle = jest.fn(async () => result);
  builder.gt = jest.fn(() => builder);
  builder.upsert = jest.fn(async () => ({ data: null, error: null }));
  builder.insert = jest.fn(async () => ({ data: null, error: null }));
  builder.update = jest.fn(() => builder);
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);

  return builder;
};

const mockFrom = jest.fn();

jest.mock("../services/SupabaseService", () => ({
  __esModule: true,
  default: {
    getClient: () => ({
      from: mockFrom,
    }),
  },
}));

jest.mock("../services/VertexAIService", () => ({
  __esModule: true,
  default: {
    generateContent: (...args: unknown[]) => mockGenerateContent(...args),
    logUsage: jest.fn(),
  },
}));

jest.mock("../utils/hash", () => ({
  hashString: jest.fn(async () => "training-cache-key"),
}));

import { TrainingPlanService } from "../services/ai/TrainingPlanService";

describe("TrainingPlanService", () => {
  const userId = "user-1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reduces intensity after low rating and high perceived difficulty", async () => {
    const updateBuilder = {
      eq: jest.fn(async () => ({ data: null, error: null })),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "user_workouts") {
        const builder = createQueryBuilder({
          data: {
            id: "uw-1",
            user_id: userId,
            workout_id: "w-1",
            scheduled_date: "2026-03-14",
            completed_date: "2026-03-14T10:00:00Z",
            reps: null,
            weight_used: null,
            rating: 2,
            perceived_difficulty: 5,
            calories_burned: 220,
            notes: "Tough session.",
          },
          error: null,
        });
        builder.update = jest.fn(() => updateBuilder as never);
        return builder;
      }

      return createQueryBuilder({ data: null, error: null });
    });

    const service = new TrainingPlanService();
    const result = await service.adjustPlanAfterWorkout(userId, "uw-1");

    expect(result).toEqual({
      notes: "Tough session. Schedule easier follow-up variation.",
    });
  });

  it("schedules lighter workouts when sleep < 6h for 3 consecutive days", async () => {
    const insertMock = jest.fn(async () => ({ data: null, error: null }));

    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case "users":
          return createQueryBuilder({
            data: {
              id: userId,
              full_name: "Mo User",
              email: "mo@example.com",
              gender: "female",
              date_of_birth: "1997-04-20",
              height_cm: 168,
              weight_kg: 64,
              body_fat_pct: null,
              experience_level: "intermediate",
              goals: ["endurance"],
              activity_level: "active",
              onboarding_completed: true,
            },
            error: null,
          });
        case "preferences":
          return createQueryBuilder({
            data: {
              available_equipment: ["bodyweight"],
              preferred_workout_time: "morning",
              training_days_per_week: 4,
              sport_focus: "",
              medical_conditions: "",
            },
            error: null,
          });
        case "workouts":
          return createQueryBuilder({
            data: [
              {
                id: "strength-1",
                name: "Sprint Circuit",
                category: "strength",
                equipment_required: ["bodyweight"],
                difficulty: "intermediate",
              },
              {
                id: "recovery-1",
                name: "Mobility Reset",
                category: "recovery",
                equipment_required: ["bodyweight"],
                difficulty: "beginner",
              },
            ],
            error: null,
          });
        case "user_workouts":
          {
            const builder = createQueryBuilder({ data: [], error: null });
            builder.insert = insertMock;
            return builder;
          }
        case "wellness_logs":
          return createQueryBuilder({
            data: [
              { sleep_hours: 5, stress_level: 8, date: "2026-03-14" },
              { sleep_hours: 5.5, stress_level: 7, date: "2026-03-13" },
              { sleep_hours: 4.5, stress_level: 8, date: "2026-03-12" },
            ],
            error: null,
          });
        case "ai_cache":
          return createQueryBuilder({ data: null, error: null });
        default:
          return createQueryBuilder({ data: null, error: null });
      }
    });

    mockGenerateContent.mockResolvedValue({
      text: "{}",
      structuredData: {
        weeklyPlan: [
          {
            day: "Monday",
            workouts: [
              {
                workout_id: "strength-1",
                sets: 3,
                reps: 10,
                rest_seconds: 60,
                notes: "Push hard",
              },
            ],
          },
        ],
      },
      usage: {
        inputTokens: 10,
        outputTokens: 12,
        model: "gemini-2.5-pro",
      },
      source: "vertex",
    });

    const service = new TrainingPlanService();
    const rows = await service.generateWeeklyPlan(userId);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.workout_id).toBe("recovery-1");
    expect(insertMock).toHaveBeenCalled();
  });
});
