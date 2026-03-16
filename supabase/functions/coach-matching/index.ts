import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { generateStructuredContent, isVertexConfigured } from '../_shared/vertex.ts';

interface CoachRow {
  id: string;
  full_name: string;
  tagline: string | null;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  specialisations: string[];
  experience_years: number;
  avg_rating: number;
  total_reviews: number;
  session_types: string[];
  price_per_hour_usd: number | null;
  radius_km: number;
}

interface MatchingProfile {
  email: string;
  full_name?: string;
  age?: number | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  bmi?: number | null;
  bmi_category?: string | null;
  bmr?: number | null;
  tdee?: number | null;
  daily_calorie_target?: number | null;
  fitness_goal?: string | null;
  fitness_level?: string | null;
  injuries?: string[];
  preferred_session?: string | null;
  budget_per_session_usd?: number | null;
  location_lat?: number | null;
  location_lng?: number | null;
  city?: string | null;
  country?: string | null;
  travel_radius_km?: number | null;
}

interface MatchResponse {
  coach_id: string;
  match_score: number;
  reasons: string[];
  concern: string | null;
}

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const a =
    sinLat * sinLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function normalizeArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function deterministicScore(profile: MatchingProfile, coach: CoachRow, distanceKm: number | null) {
  let score = 48;
  const normalizedGoal = (profile.fitness_goal ?? '').toLowerCase().replace(/\s+/g, '_');

  if (normalizedGoal && coach.specialisations.some((entry) => entry.toLowerCase().includes(normalizedGoal))) {
    score += 18;
  }

  if (profile.preferred_session && coach.session_types.includes(profile.preferred_session)) {
    score += 12;
  }

  if (profile.budget_per_session_usd !== null && profile.budget_per_session_usd !== undefined) {
    if (coach.price_per_hour_usd !== null && coach.price_per_hour_usd <= profile.budget_per_session_usd) {
      score += 10;
    } else {
      score -= 8;
    }
  }

  score += Math.min(coach.experience_years, 15);
  score += Math.min(coach.avg_rating * 2, 10);

  if (distanceKm !== null) {
    if (distanceKm <= 5) {
      score += 10;
    } else if (distanceKm <= 15) {
      score += 5;
    } else if ((profile.travel_radius_km ?? 25) < distanceKm) {
      score -= 10;
    }
  }

  if ((profile.injuries ?? []).length > 0) {
    const injuryTerms = (profile.injuries ?? []).map((entry) => entry.toLowerCase());
    if (coach.specialisations.some((entry) => injuryTerms.some((injury) => entry.toLowerCase().includes(injury) || entry.toLowerCase().includes('rehab')))) {
      score += 8;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildFallbackMatches(profile: MatchingProfile, coaches: Array<CoachRow & { distance_km: number | null }>): MatchResponse[] {
  return coaches
    .map((coach) => {
      const score = deterministicScore(profile, coach, coach.distance_km);
      const reasons = [
        profile.fitness_goal
          ? `${coach.full_name} covers ${coach.specialisations.join(', ') || 'general fitness'} for your ${profile.fitness_goal} goal.`
          : `${coach.full_name} offers ${coach.session_types.join(', ') || 'flexible'} sessions.`,
        coach.price_per_hour_usd !== null && profile.budget_per_session_usd !== null && profile.budget_per_session_usd !== undefined
          ? `Their rate of $${coach.price_per_hour_usd}/hr is ${coach.price_per_hour_usd <= profile.budget_per_session_usd ? 'inside' : 'above'} your budget.`
          : `They bring ${coach.experience_years} years of coaching experience.`,
        coach.distance_km !== null
          ? `${coach.city} is ${coach.distance_km.toFixed(1)} km from the requested location.`
          : `They already operate in ${coach.city}, ${coach.country}.`,
      ];

      let concern: string | null = null;
      if (coach.price_per_hour_usd !== null && profile.budget_per_session_usd !== null && profile.budget_per_session_usd !== undefined && coach.price_per_hour_usd > profile.budget_per_session_usd) {
        concern = 'Price is above the requested budget.';
      } else if (coach.distance_km !== null && (profile.travel_radius_km ?? 25) < coach.distance_km) {
        concern = 'Distance is outside the requested travel radius.';
      }

      return {
        coach_id: coach.id,
        match_score: score,
        reasons,
        concern,
      };
    })
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 5);
}

function buildPrompt(profile: MatchingProfile, coaches: Array<CoachRow & { distance_km: number | null }>) {
  return `You are matching a fitness client to local coaches.

Client profile:
- BMI: ${profile.bmi ?? 'unknown'} (${profile.bmi_category ?? 'unknown'})
- Goal: ${profile.fitness_goal ?? 'general fitness'}
- Fitness level: ${profile.fitness_level ?? 'unknown'}
- Injuries: ${(profile.injuries ?? []).join(', ') || 'none'}
- Preferred session: ${profile.preferred_session ?? 'any'}
- Budget: ${profile.budget_per_session_usd ?? 'unspecified'}
- Location: ${profile.city ?? 'unknown'}, ${profile.country ?? 'unknown'}

Available coaches:
${coaches
  .map(
    (coach) => `- ${coach.id} | ${coach.full_name} | ${coach.city}, ${coach.country} | ${coach.specialisations.join(', ') || 'general'} | ${coach.session_types.join(', ') || 'none'} | ${coach.experience_years} years | rating ${coach.avg_rating} (${coach.total_reviews} reviews) | $${coach.price_per_hour_usd ?? 'n/a'} | distance ${coach.distance_km?.toFixed(1) ?? 'unknown'} km`,
  )
  .join('\n')}

Return JSON:
{
  "matches": [
    {
      "coach_id": "uuid",
      "match_score": 0,
      "reasons": ["reason 1", "reason 2", "reason 3"],
      "concern": "optional concern or null"
    }
  ]
}

Use 3 concise reasons per coach. Only include coaches from the provided list.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const admin = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const body = (await req.json().catch(() => ({}))) as MatchingProfile;
    if (!body.email) {
      return jsonResponse({ error: 'Email is required.' }, 400);
    }

    const profile: MatchingProfile = {
      ...body,
      injuries: normalizeArray(body.injuries),
    };

    const { data: coaches, error } = await admin
      .from('coaches')
      .select('id, full_name, tagline, city, country, lat, lng, specialisations, experience_years, avg_rating, total_reviews, session_types, price_per_hour_usd, radius_km')
      .eq('status', 'approved')
      .returns<CoachRow[]>();

    if (error) {
      throw error;
    }

    const hydrated = (coaches ?? [])
      .map((coach) => {
        const distance =
          profile.location_lat !== null &&
          profile.location_lat !== undefined &&
          profile.location_lng !== null &&
          profile.location_lng !== undefined &&
          coach.lat !== null &&
          coach.lng !== null
            ? haversineDistanceKm(profile.location_lat, profile.location_lng, coach.lat, coach.lng)
            : null;

        return {
          ...coach,
          distance_km: distance,
        };
      })
      .filter((coach) => {
        if (profile.preferred_session && profile.preferred_session !== 'any' && !coach.session_types.includes(profile.preferred_session)) {
          return false;
        }

        if (profile.budget_per_session_usd !== null && profile.budget_per_session_usd !== undefined && coach.price_per_hour_usd !== null) {
          return coach.price_per_hour_usd <= profile.budget_per_session_usd + 20;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.distance_km === null && b.distance_km === null) {
          return b.avg_rating - a.avg_rating;
        }
        if (a.distance_km === null) {
          return 1;
        }
        if (b.distance_km === null) {
          return -1;
        }
        return a.distance_km - b.distance_km;
      })
      .slice(0, 25);

    const fallbackMatches = buildFallbackMatches(profile, hydrated);
    let matches = fallbackMatches;

    if (hydrated.length > 0 && isVertexConfigured()) {
      try {
        const aiResponse = await generateStructuredContent<{ matches?: MatchResponse[] }>(
          Deno.env.get('VERTEX_GEMINI_MODEL') ?? 'gemini-2.5-pro',
          buildPrompt(profile, hydrated),
          'You are a precise coach-matching engine. Return only valid JSON.',
        );

        if (Array.isArray(aiResponse.matches) && aiResponse.matches.length > 0) {
          const allowed = new Set(hydrated.map((coach) => coach.id));
          matches = aiResponse.matches
            .filter((entry) => allowed.has(entry.coach_id))
            .map((entry) => ({
              coach_id: entry.coach_id,
              match_score: Math.max(0, Math.min(100, Math.round(Number(entry.match_score ?? 0)))),
              reasons: normalizeArray(entry.reasons).slice(0, 3),
              concern: typeof entry.concern === 'string' && entry.concern.trim() ? entry.concern : null,
            }))
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, 5);
        }
      } catch {
        matches = fallbackMatches;
      }
    }

    return jsonResponse({
      matches,
      considered_coaches: hydrated.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to match coaches.';
    return jsonResponse({ error: message }, 500);
  }
});
