import type { NutritionGoalDraft, Preferences, UserProfile } from '../models';
import nutritionAIService from '../services/ai/NutritionAIService';

const baseProfile: UserProfile = {
  id: 'user-1',
  full_name: 'Mo User',
  email: 'mo@example.com',
  gender: 'male',
  date_of_birth: '2008-04-12',
  height_cm: 178,
  weight_kg: 68,
  body_fat_pct: null,
  experience_level: 'intermediate',
  goals: ['build_muscle'],
  activity_level: 'active',
  onboarding_completed: true,
};

const adultProfile: UserProfile = {
  ...baseProfile,
  date_of_birth: '1997-04-12',
};

const basePreferences: Preferences = {
  user_id: 'user-1',
  training_days_per_week: 4,
  available_equipment: ['bodyweight'],
  preferred_workout_time: 'morning',
  dietary_restrictions: ['halal'],
  country_code: 'ZW',
  allergies: ['peanuts'],
  cuisine_preferences: ['sadza', 'nyama'],
  medical_conditions: 'asthma',
  activity_type: 'strength',
  sport_focus: '',
  interest_in_mindfulness: false,
  wants_challenges: true,
  has_wearable: false,
};

function createDraft(overrides: Partial<NutritionGoalDraft> = {}): NutritionGoalDraft {
  return {
    goal_type: 'gain_weight',
    target_weight_kg: 76,
    current_weight_kg: 68,
    target_body_fat_pct: null,
    target_muscle_mass_kg: null,
    target_date: '2026-03-29',
    meals_per_day: 3,
    country_code: 'ZW',
    cuisine_preference: [],
    allergies_snapshot: [],
    dietary_restrictions_snapshot: [],
    medical_conditions_snapshot: '',
    ...overrides,
  };
}

describe('NutritionAIService', () => {
  it('buildGoalPreview surfaces aggressive pace and safety warnings', () => {
    const preview = nutritionAIService.buildGoalPreview(
      createDraft({ medical_conditions_snapshot: 'asthma' }),
      baseProfile,
    );

    expect(preview.safetyFlags).toEqual(
      expect.arrayContaining([
        'minor_requires_professional_guidance',
        'medical_condition_review',
        'aggressive_weight_gain_rate',
      ]),
    );
    expect(preview.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining('minors'),
        expect.stringContaining('medical condition'),
        expect.stringContaining('weight gain'),
      ]),
    );
    expect(preview.recommendedMealsPerDay).toBeGreaterThanOrEqual(4);
  });

  it('buildGoalPayload falls back to stored preferences when snapshots are empty', () => {
    const payload = nutritionAIService.buildGoalPayload(createDraft(), adultProfile, basePreferences);

    expect(payload.allergies_snapshot).toEqual(['peanuts']);
    expect(payload.dietary_restrictions_snapshot).toEqual(['halal']);
    expect(payload.cuisine_preference).toEqual(['sadza', 'nyama']);
    expect(payload.medical_conditions_snapshot).toBe('asthma');
    expect(payload.safety_flags).toEqual(expect.arrayContaining(['aggressive_weight_gain_rate']));
    expect(payload.goal_summary).toContain('Estimated protein');
  });

  it('returns coaching messages based on calorie, protein, and hydration gaps', () => {
    const lowCalories = nutritionAIService.getDailyNutritionCoaching(
      { calories: 700, protein_g: 30, carbs_g: 70, fat_g: 18, water_liters: 0.8 },
      { dailyCalorieTarget: 2400, protein_g: 160, carbs_g: 250, fat_g: 70, fiber_g: 30, sodium_mg: 2300, water_min_liters: 2.8, water_max_liters: 3.4 },
    );

    const lowProtein = nutritionAIService.getDailyNutritionCoaching(
      { calories: 1500, protein_g: 70, carbs_g: 160, fat_g: 45, water_liters: 2.0 },
      { dailyCalorieTarget: 2400, protein_g: 160, carbs_g: 250, fat_g: 70, fiber_g: 30, sodium_mg: 2300, water_min_liters: 2.8, water_max_liters: 3.4 },
    );

    const onTrack = nutritionAIService.getDailyNutritionCoaching(
      { calories: 1850, protein_g: 130, carbs_g: 200, fat_g: 55, water_liters: 2.4 },
      { dailyCalorieTarget: 2400, protein_g: 160, carbs_g: 250, fat_g: 70, fiber_g: 30, sodium_mg: 2300, water_min_liters: 2.8, water_max_liters: 3.4 },
    );

    expect(lowCalories).toContain('behind on energy intake');
    expect(lowProtein).toContain('Protein is trending low');
    expect(onTrack).toContain('tracking close to target');
  });
});
