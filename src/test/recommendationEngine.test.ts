import type { UserProfile } from "../models";

const mockSetRecommendations = jest.fn();
const mockGenerateEmbedding = jest.fn();
const mockHashString = jest.fn();

type QueryResult = { data: unknown; error: unknown };
type QueryBuilder = {
  select: jest.Mock;
  eq: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  upsert: jest.Mock;
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
  builder.upsert = jest.fn(async () => ({ data: null, error: null }));
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);

  return builder;
};

const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock("../services/SupabaseService", () => ({
  __esModule: true,
  default: {
    getClient: () => ({
      from: mockFrom,
      rpc: mockRpc,
    }),
  },
}));

jest.mock("../services/VertexAIService", () => ({
  __esModule: true,
  default: {
    generateEmbedding: (...args: unknown[]) => mockGenerateEmbedding(...args),
    logUsage: jest.fn(),
  },
}));

jest.mock("../utils/hash", () => ({
  hashString: (...args: unknown[]) => mockHashString(...args),
}));

jest.mock("../stores/recommendationStore", () => ({
  useRecommendationStore: {
    getState: () => ({
      setRecommendations: mockSetRecommendations,
    }),
  },
}));

import { RecommendationEngine } from "../services/ai/RecommendationEngine";

describe("RecommendationEngine", () => {
  const userId = "user-1";
  const baseProfile: UserProfile = {
    id: userId,
    full_name: "Mo User",
    email: "mo@example.com",
    gender: "male",
    date_of_birth: "1998-01-15",
    height_cm: 180,
    weight_kg: 78,
    body_fat_pct: null,
    experience_level: "beginner",
    goals: ["weight_loss"],
    activity_level: "active",
    onboarding_completed: true,
    points: 0,
    push_token: null,
    notifications_enabled: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    mockHashString.mockResolvedValue("hash-1");
  });

  it("recommends only beginner-safe workouts for a new beginner user", async () => {
    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case "users":
          return createQueryBuilder({ data: baseProfile, error: null });
        case "preferences":
          return createQueryBuilder({
            data: { available_equipment: ["bodyweight"], activity_type: "strength", sport_focus: "" },
            error: null,
          });
        case "user_workouts":
          return createQueryBuilder({ data: [], error: null });
        case "wellness_logs":
          return createQueryBuilder({ data: [], error: null });
        case "ml_models":
          return createQueryBuilder({ data: null, error: null });
        case "workouts":
          return createQueryBuilder({
            data: [
              {
                id: "w1",
                name: "Bodyweight Squat",
                category: "strength",
                description: null,
                duration_minutes: 20,
                equipment_required: ["bodyweight"],
                calories_estimate: 120,
                difficulty: "beginner",
                sport_tag: null,
                video_url: null,
              },
              {
                id: "w2",
                name: "Advanced Barbell Complex",
                category: "strength",
                description: null,
                duration_minutes: 45,
                equipment_required: ["barbell"],
                calories_estimate: 340,
                difficulty: "advanced",
                sport_tag: null,
                video_url: null,
              },
            ],
            error: null,
          });
        default:
          return createQueryBuilder({ data: [], error: null });
      }
    });

    mockRpc.mockResolvedValue({ data: [], error: null });

    const engine = new RecommendationEngine();
    const recommendations = await engine.getWorkoutRecommendations(userId);

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0]?.id).toBe("w1");
    expect(mockSetRecommendations).toHaveBeenCalledWith([
      { id: "w1", title: "Bodyweight Squat", subtitle: "strength", type: "workout" },
    ]);
  });

  it("filters out workouts requiring unavailable equipment", async () => {
    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case "users":
          return createQueryBuilder({ data: baseProfile, error: null });
        case "preferences":
          return createQueryBuilder({
            data: { available_equipment: ["bodyweight"], activity_type: "strength", sport_focus: "" },
            error: null,
          });
        case "user_workouts":
        case "wellness_logs":
          return createQueryBuilder({ data: [], error: null });
        case "ml_models":
          return createQueryBuilder({ data: null, error: null });
        case "workouts":
          return createQueryBuilder({
            data: [
              {
                id: "bodyweight",
                name: "Jumping Jacks",
                category: "cardio",
                description: null,
                duration_minutes: 10,
                equipment_required: ["bodyweight"],
                calories_estimate: 80,
                difficulty: "beginner",
                sport_tag: null,
                video_url: null,
              },
              {
                id: "machine",
                name: "Cable Fly",
                category: "strength",
                description: null,
                duration_minutes: 15,
                equipment_required: ["cable_machine"],
                calories_estimate: 90,
                difficulty: "beginner",
                sport_tag: null,
                video_url: null,
              },
            ],
            error: null,
          });
        default:
          return createQueryBuilder({ data: [], error: null });
      }
    });

    mockRpc.mockResolvedValue({ data: [], error: null });

    const engine = new RecommendationEngine();
    const recommendations = await engine.getWorkoutRecommendations(userId);

    expect(recommendations.map((item) => item.id)).toEqual(["bodyweight"]);
  });

  it("updates preference vector hash to avoid redundant re-embedding", async () => {
    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case "users":
          return createQueryBuilder({ data: baseProfile, error: null });
        case "preferences":
          return createQueryBuilder({
            data: { available_equipment: ["bodyweight"], activity_type: "mixed", sport_focus: "running" },
            error: null,
          });
        case "user_workouts":
        case "wellness_logs":
          return createQueryBuilder({ data: [], error: null });
        case "ml_models":
          return createQueryBuilder({ data: { user_id: userId, input_hash: "hash-1" }, error: null });
        default:
          return createQueryBuilder({ data: [], error: null });
      }
    });

    const engine = new RecommendationEngine();
    await engine.updatePreferenceVector(userId);

    expect(mockGenerateEmbedding).not.toHaveBeenCalled();
  });
});
