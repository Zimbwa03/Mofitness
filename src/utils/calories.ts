import type { ActivityLevel, UserProfile } from "../models";

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  active: 1.55,
  highly_active: 1.725,
};

export const calculateAge = (dateOfBirth: string | null) => {
  if (!dateOfBirth) {
    return 30;
  }

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
};

export const calculateBMR = (profile: UserProfile) => {
  const weight = profile.weight_kg ?? 70;
  const height = profile.height_cm ?? 170;
  const age = calculateAge(profile.date_of_birth);
  const maleOffset = profile.gender === "male" ? 5 : -161;

  return 10 * weight + 6.25 * height - 5 * age + maleOffset;
};

export const calculateTDEE = (profile: UserProfile) => {
  const activityLevel = profile.activity_level ?? "lightly_active";
  return Math.round(calculateBMR(profile) * activityMultipliers[activityLevel]);
};
