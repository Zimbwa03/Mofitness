export type BmiCategory = "underweight" | "normal" | "overweight" | "obese";
export type ActivityFactorKey = "sedentary" | "light" | "moderate" | "very_active";

const ACTIVITY_FACTORS: Record<ActivityFactorKey, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
};

export function calculateBmi(heightCm: number, weightKg: number) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return null;
  }

  const meters = heightCm / 100;
  return Number((weightKg / (meters * meters)).toFixed(2));
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) {
    return "underweight";
  }

  if (bmi < 25) {
    return "normal";
  }

  if (bmi < 30) {
    return "overweight";
  }

  return "obese";
}

export function calculateBmrMifflinStJeor(args: {
  gender?: string | null;
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
}) {
  const { gender, age, heightCm, weightKg } = args;
  if (!heightCm || !weightKg || !age) {
    return null;
  }

  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const sexAdjustment = gender?.toLowerCase().startsWith("m") ? 5 : -161;
  return Number((base + sexAdjustment).toFixed(2));
}

export function calculateTdee(bmr: number, activityLevel: ActivityFactorKey) {
  return Number((bmr * ACTIVITY_FACTORS[activityLevel]).toFixed(2));
}

export function calculateIdealWeightRange(heightCm: number) {
  if (!heightCm || heightCm <= 0) {
    return null;
  }

  const meters = heightCm / 100;
  return {
    minKg: Number((18.5 * meters * meters).toFixed(2)),
    maxKg: Number((24.9 * meters * meters).toFixed(2)),
  };
}

export function calculateDailyCalorieTarget(args: {
  tdee: number;
  goal?: string | null;
}) {
  const normalizedGoal = (args.goal ?? "").toLowerCase();
  if (normalizedGoal.includes("lose")) {
    return Math.round(args.tdee - 400);
  }

  if (normalizedGoal.includes("gain") || normalizedGoal.includes("muscle")) {
    return Math.round(args.tdee + 300);
  }

  return Math.round(args.tdee);
}

export function haversineDistanceKm(args: {
  lat1: number;
  lng1: number;
  lat2: number;
  lng2: number;
}) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(args.lat2 - args.lat1);
  const dLng = toRad(args.lng2 - args.lng1);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const a =
    sinLat * sinLat +
    Math.cos(toRad(args.lat1)) *
      Math.cos(toRad(args.lat2)) *
      sinLng *
      sinLng;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadiusKm * c).toFixed(2));
}
