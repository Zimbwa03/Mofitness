import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  try {
    const serverClient = createSupabaseServerClient();
    const admin = getSupabaseAdminClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { data: role } = await serverClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "coach")
      .maybeSingle();

    if (!role) {
      return NextResponse.json({ error: "Coach access required." }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};

    const allowedStringFields = [
      "full_name",
      "tagline",
      "bio",
      "phone",
      "website_url",
      "instagram_url",
      "facebook_url",
      "linkedin_url",
      "youtube_url",
      "city",
      "country",
      "address",
    ];
    for (const key of allowedStringFields) {
      if (typeof body[key] === "string") {
        patch[key] = body[key];
      }
    }

    if (Array.isArray(body.specialisations)) {
      patch.specialisations = body.specialisations.filter((value) => typeof value === "string");
    }
    if (Array.isArray(body.session_types)) {
      patch.session_types = body.session_types.filter((value) => typeof value === "string");
    }
    if (Array.isArray(body.languages)) {
      patch.languages = body.languages.filter((value) => typeof value === "string");
    }

    if (typeof body.price_per_hour_usd === "number" && Number.isFinite(body.price_per_hour_usd)) {
      patch.price_per_hour_usd = body.price_per_hour_usd;
    }
    if (typeof body.radius_km === "number" && Number.isFinite(body.radius_km)) {
      patch.radius_km = body.radius_km;
    }
    if (typeof body.availability === "object" && body.availability !== null) {
      patch.availability = body.availability;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const { data: coach, error } = await admin
      .from("coaches")
      .update(patch)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ coach });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update coach profile." },
      { status: 500 },
    );
  }
}
