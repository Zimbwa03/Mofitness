import fs from 'node:fs';
import path from 'node:path';

import { createClient } from '@supabase/supabase-js';

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function isoDate(daysFromNow = 0) {
  const next = new Date();
  next.setDate(next.getDate() + daysFromNow);
  return next.toISOString().slice(0, 10);
}

async function ensureProfileRows(supabase, user) {
  const profilePayload = {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? 'Nutrition Smoke',
    gender: 'prefer_not_to_say',
    experience_level: 'beginner',
    goals: ['build_muscle'],
    activity_level: 'active',
    onboarding_completed: true,
  };

  const preferencesPayload = {
    user_id: user.id,
    training_days_per_week: 4,
    available_equipment: ['bodyweight'],
    preferred_workout_time: 'morning',
    dietary_restrictions: [],
    country_code: 'ZW',
    allergies: [],
    cuisine_preferences: ['sadza', 'mutakura', 'nyama'],
    medical_conditions: '',
    activity_type: 'strength',
    sport_focus: 'general_fitness',
    interest_in_mindfulness: false,
    wants_challenges: true,
    has_wearable: false,
  };

  const profileResult = await supabase.from('users').upsert(profilePayload).select('id').single();
  if (profileResult.error) {
    throw profileResult.error;
  }

  const preferencesResult = await supabase
    .from('preferences')
    .upsert(preferencesPayload, { onConflict: 'user_id' })
    .select('user_id')
    .single();
  if (preferencesResult.error) {
    throw preferencesResult.error;
  }
}

async function createActiveGoal(supabase, userId) {
  const deactivateResult = await supabase
    .from('nutrition_goals')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (deactivateResult.error) {
    throw deactivateResult.error;
  }

  const goalPayload = {
    user_id: userId,
    goal_type: 'build_muscle',
    target_weight_kg: 82,
    current_weight_kg: 78,
    target_body_fat_pct: null,
    target_muscle_mass_kg: null,
    target_date: isoDate(42),
    daily_calorie_target: 2900,
    protein_target_g: 220,
    carbs_target_g: 290,
    fat_target_g: 81,
    fiber_target_g: 30,
    sodium_target_mg: 2300,
    water_target_min_liters: 3.0,
    water_target_max_liters: 4.0,
    meals_per_day: 4,
    country_code: 'ZW',
    cuisine_preference: ['sadza', 'mutakura', 'nyama'],
    allergies_snapshot: [],
    dietary_restrictions_snapshot: [],
    medical_conditions_snapshot: '',
    goal_summary: 'Smoke test muscle-building goal',
    safety_flags: [],
    is_active: true,
  };

  const goalResult = await supabase.from('nutrition_goals').insert(goalPayload).select('*').single();
  if (goalResult.error) {
    throw goalResult.error;
  }

  return goalResult.data;
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env'));

  const url = requireEnv('SUPABASE_URL');
  const anonKey = requireEnv('SUPABASE_ANON_KEY');
  const email = requireEnv('NUTRITION_SMOKE_EMAIL');
  const password = requireEnv('NUTRITION_SMOKE_PASSWORD');

  const supabase = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const signInResult = await supabase.auth.signInWithPassword({ email, password });
  if (signInResult.error || !signInResult.data.user || !signInResult.data.session) {
    throw signInResult.error ?? new Error('Unable to sign in smoke test user.');
  }

  const user = signInResult.data.user;
  const accessToken = signInResult.data.session.access_token;
  console.log(`Signed in as ${user.email} (${user.id})`);

  await ensureProfileRows(supabase, user);
  console.log('Profile and preferences ready.');

  const goal = await createActiveGoal(supabase, user.id);
  const planDate = isoDate(1);

  const planInvoke = await supabase.functions.invoke('nutrition-plan', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      action: 'generate',
      planDate,
      goalId: goal.id,
    },
  });

  if (planInvoke.error || !planInvoke.data) {
    throw planInvoke.error ?? new Error('nutrition-plan returned no data.');
  }

  const plan = planInvoke.data;
  const firstMeal = Array.isArray(plan.meals) ? plan.meals[0] : null;
  if (!firstMeal) {
    throw new Error('nutrition-plan returned no meals.');
  }

  console.log(`Generated plan ${plan.id ?? '(unsaved)'} for ${plan.plan_date}. First meal: ${firstMeal.english_name}`);

  const imageInvoke = await supabase.functions.invoke('nutrition-meal-image', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: {
      meal: firstMeal,
      countryCode: goal.country_code,
      countryName: 'Zimbabwe',
      style: 'realistic_photo',
      planId: plan.id,
    },
  });

  if (imageInvoke.error || !imageInvoke.data) {
    throw imageInvoke.error ?? new Error('nutrition-meal-image returned no data.');
  }

  const imageData = imageInvoke.data;
  const usingVertexImagen = imageData.mimeType === 'image/png';

  console.log(`Meal image generated: ${imageData.imageUrl}`);
  console.log(`Image mode: ${usingVertexImagen ? 'Vertex Imagen' : 'SVG fallback'}`);

  if (!usingVertexImagen) {
    throw new Error('nutrition-meal-image fell back to SVG. Check Vertex/Imagen permissions and secrets.');
  }

  console.log('Nutrition smoke test passed.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
