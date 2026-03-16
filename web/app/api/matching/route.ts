import { NextResponse } from "next/server";

import type { MatchingProfile, MatchingResult } from "@shared/features/findCoach/shared/types";

import { getServerEnv } from "@/lib/env";
import { sendPlatformEmail } from "@/lib/email/resend";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database";

type WebUserProfileInsert = Database["public"]["Tables"]["web_user_profiles"]["Insert"];
type CoachMatchInsert = Database["public"]["Tables"]["coach_matches"]["Insert"];

export async function POST(request: Request) {
  try {
    const env = getServerEnv();
    const admin = getSupabaseAdminClient();
    const body = (await request.json()) as MatchingProfile;
    const email = String(body.email ?? "");

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const profilePayload: WebUserProfileInsert = {
      email,
      full_name: body.full_name ?? null,
      age: body.age ?? null,
      gender: body.gender ?? null,
      height_cm: body.height_cm ?? null,
      weight_kg: body.weight_kg ?? null,
      bmi: body.bmi ?? null,
      bmi_category: body.bmi_category ?? null,
      bmr: body.bmr ?? null,
      tdee: body.tdee ?? null,
      daily_calorie_target: body.daily_calorie_target ?? null,
      fitness_goal: body.fitness_goal ?? null,
      fitness_level: body.fitness_level ?? null,
      injuries: body.injuries ?? [],
      preferred_session: body.preferred_session ?? null,
      budget_per_session_usd: body.budget_per_session_usd ?? null,
      location_lat: body.location_lat ?? null,
      location_lng: body.location_lng ?? null,
      city: body.city ?? null,
      country: body.country ?? null,
      travel_radius_km: body.travel_radius_km ?? null,
      send_results_by_email: body.send_results_by_email ?? true,
      notify_new_coaches: body.notify_new_coaches ?? false,
    };

    const { data: profile } = await admin
      .from("web_user_profiles")
      .upsert(profilePayload, { onConflict: "email" })
      .select()
      .single();

    const response = await fetch(`${env.supabaseUrl}/functions/v1/coach-matching`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.supabaseAnonKey,
        Authorization: `Bearer ${env.serviceRoleKey || env.supabaseAnonKey}`,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as {
      error?: string;
      matches?: MatchingResult[];
    };

    if (!response.ok) {
      throw new Error(payload.error || "Unable to match coaches.");
    }

    const coachIds = (payload.matches ?? []).map((match) => match.coach_id);
    const { data: coaches } = coachIds.length
      ? await admin.from("coaches").select("id, slug, full_name, city").in("id", coachIds)
      : { data: [] };

    if (profile && payload.matches?.length) {
      await admin
        .from("coach_matches")
        .delete()
        .eq("web_profile_id", profile.id);

      const matchPayloads: CoachMatchInsert[] = payload.matches.map((match) => ({
        web_profile_id: profile.id,
        coach_id: match.coach_id,
        match_score: match.match_score,
        match_reasons: match.reasons,
        concern_notes: match.concern,
      }));

      await admin.from("coach_matches").insert(matchPayloads);
    }

    if (body.send_results_by_email !== false && payload.matches?.length) {
      await sendPlatformEmail({
        to: email,
        subject: "Your Mofitness coach matches are ready",
        category: "coach_match_results",
        html: `<div style="font-family: sans-serif; background: #0A0A0A; color: #F0F0F0; padding: 24px;">
          <h1 style="color:#C8F135;">Your top Mofitness coach matches</h1>
          <p>We ranked nearby verified coaches for your goal.</p>
          <ul>
            ${payload.matches
              .map((match) => `<li>${match.match_score}% match - ${match.reasons.join(" | ")}</li>`)
              .join("")}
          </ul>
        </div>`,
      });
    }

    return NextResponse.json({
      matches: (payload.matches ?? []).map((match) => ({
        ...match,
        coach: (coaches ?? []).find((coach) => coach.id === match.coach_id) ?? null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to match coaches." },
      { status: 500 },
    );
  }
}
