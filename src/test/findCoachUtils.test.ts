import {
  calculateBmi,
  calculateBmrMifflinStJeor,
  calculateDailyCalorieTarget,
  calculateIdealWeightRange,
  calculateTdee,
  getBmiCategory,
  haversineDistanceKm,
} from "../features/findCoach/shared/calculations";
import { applyCoachFilters, slugifyCoachName } from "../features/findCoach/shared/filters";
import type { CoachRecord } from "../features/findCoach/shared/types";

const coachFixture: CoachRecord[] = [
  {
    id: "coach-1",
    user_id: "user-1",
    slug: "coach-one",
    full_name: "Coach One",
    email: "coach1@example.com",
    bio: "Helps with weight loss and virtual coaching",
    country: "Zimbabwe",
    city: "Harare",
    radius_km: 20,
    specialisations: ["weight_loss", "nutrition_coaching"],
    experience_years: 6,
    languages: ["English"],
    session_types: ["virtual", "in_person"],
    currency: "USD",
    availability: {},
    status: "approved",
    total_clients: 10,
    avg_rating: 4.9,
    total_reviews: 28,
    response_rate_pct: 100,
    is_featured: true,
    created_at: "2026-03-16T00:00:00.000Z",
    updated_at: "2026-03-16T00:00:00.000Z",
    lat: -17.8249,
    lng: 31.053,
    price_per_hour_usd: 40,
  },
  {
    id: "coach-2",
    user_id: "user-2",
    slug: "coach-two",
    full_name: "Coach Two",
    email: "coach2@example.com",
    bio: "Muscle gain specialist",
    country: "Zimbabwe",
    city: "Bulawayo",
    radius_km: 20,
    specialisations: ["muscle_gain"],
    experience_years: 4,
    languages: ["English"],
    session_types: ["in_person"],
    currency: "USD",
    availability: {},
    status: "approved",
    total_clients: 8,
    avg_rating: 4.5,
    total_reviews: 14,
    response_rate_pct: 92,
    is_featured: false,
    created_at: "2026-03-16T00:00:00.000Z",
    updated_at: "2026-03-16T00:00:00.000Z",
    lat: -20.1325,
    lng: 28.6265,
    price_per_hour_usd: 65,
  },
];

describe("find coach calculations", () => {
  it("calculates BMI and category", () => {
    const bmi = calculateBmi(175, 82);
    expect(bmi).toBeCloseTo(26.78, 2);
    expect(getBmiCategory(bmi ?? 0)).toBe("overweight");
  });

  it("calculates BMR, TDEE, ideal range, and calories", () => {
    const bmr = calculateBmrMifflinStJeor({
      gender: "male",
      age: 30,
      heightCm: 180,
      weightKg: 80,
    });
    expect(bmr).toBeCloseTo(1780, 0);
    expect(calculateTdee(bmr ?? 0, "moderate")).toBeCloseTo(2759, 0);
    expect(calculateIdealWeightRange(180)).toEqual({
      minKg: 59.94,
      maxKg: 80.68,
    });
    expect(calculateDailyCalorieTarget({ tdee: 2400, goal: "lose_weight" })).toBe(2000);
  });

  it("calculates distance in kilometers", () => {
    const distance = haversineDistanceKm({
      lat1: -17.8252,
      lng1: 31.0335,
      lat2: -17.8249,
      lng2: 31.053,
    });
    expect(distance).toBeGreaterThan(2);
    expect(distance).toBeLessThan(3);
  });
});

describe("find coach filters", () => {
  it("slugifies coach names", () => {
    expect(slugifyCoachName("Coach Tendai Moyo")).toBe("coach-tendai-moyo");
  });

  it("filters coaches by specialisation and price", () => {
    const filtered = applyCoachFilters(coachFixture, {
      specialisations: ["weight_loss"],
      maxPriceUsd: 50,
      userLat: -17.8252,
      userLng: 31.0335,
      sort: "nearest",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.coach.id).toBe("coach-1");
  });
});
