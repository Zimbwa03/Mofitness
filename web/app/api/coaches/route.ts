import { NextResponse } from "next/server";

import { slugifyCoachName } from "@shared/features/findCoach/shared/filters";
import { haversineDistanceKm } from "@shared/features/findCoach/shared/calculations";

import { sendPlatformEmail } from "@/lib/email/resend";
import { sendExpoPushNotifications } from "@/lib/notifications/expo";
import { getApprovedCoaches } from "@/lib/platform-data";
import { uploadFileToBucket } from "@/lib/storage";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CoachInsert = Database["public"]["Tables"]["coaches"]["Insert"];
type CoachCertificationInsert = Database["public"]["Tables"]["coach_certifications"]["Insert"];
type CoachDocumentInsert = Database["public"]["Tables"]["coach_documents"]["Insert"];
type CoachStatus = Database["public"]["Tables"]["coaches"]["Row"]["status"];

const COACH_STATUSES: CoachStatus[] = [
  "draft",
  "pending",
  "under_review",
  "approved",
  "rejected",
  "suspended",
  "more_info_required",
];

function parseCsv(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildDocumentPath(userId: string, prefix: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]+/g, "-");
  return `${userId}/${prefix}-${Date.now()}-${safeName}`;
}

function readOptionalText(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseCoachStatus(value: unknown): CoachStatus | null {
  return typeof value === "string" && COACH_STATUSES.includes(value as CoachStatus)
    ? (value as CoachStatus)
    : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coaches = await getApprovedCoaches({
    search: searchParams.get("search") ?? undefined,
    specialisations: searchParams.get("specialisation")
      ? [searchParams.get("specialisation") as string]
      : [],
    sessionTypes: searchParams.get("sessionType")
      ? [searchParams.get("sessionType") as string]
      : [],
    maxPriceUsd: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined,
  });

  return NextResponse.json({ coaches });
}

export async function POST(request: Request) {
  try {
    const admin = getSupabaseAdminClient();
    const formData = await request.formData();

    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const country = String(formData.get("country") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();

    if (!fullName || !email || !password || !country || !city) {
      return NextResponse.json(
        { error: "Full name, email, password, country, and city are required." },
        { status: 400 },
      );
    }

    const authUser = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authUser.error || !authUser.data.user) {
      throw authUser.error || new Error("Unable to create auth user.");
    }

    const userId = authUser.data.user.id;
    const slug = `${slugifyCoachName(fullName)}-${Date.now().toString().slice(-6)}`;

    const profilePhoto = formData.get("profilePhoto");
    const certificationFile = formData.get("certificationFile");
    const governmentIdFront = formData.get("governmentIdFront");
    const governmentIdBack = formData.get("governmentIdBack");
    const proofOfAddress = formData.get("proofOfAddress");
    const selfieWithId = formData.get("selfieWithId");

    const profilePhotoUrl =
      profilePhoto instanceof File && profilePhoto.size > 0
        ? await uploadFileToBucket({
            bucket: "coach-profile-photos",
            path: buildDocumentPath(userId, "profile", profilePhoto),
            file: profilePhoto,
            isPublic: true,
          })
        : null;

    await admin.from("users").insert({
      id: userId,
      full_name: fullName,
      email,
      onboarding_completed: true,
    });

    await admin.from("user_roles").insert({
      user_id: userId,
      role: "coach",
    });

    const coachPayload: CoachInsert = {
        user_id: userId,
        slug,
        full_name: fullName,
        email,
        phone: readOptionalText(formData, "phone"),
        profile_photo_url: profilePhotoUrl,
        bio: readOptionalText(formData, "bio") ?? "",
        tagline: readOptionalText(formData, "tagline"),
        country,
        city,
        address: readOptionalText(formData, "address"),
        radius_km: Number(formData.get("radiusKm") ?? 20),
        specialisations: parseCsv(formData.get("specialisations")),
        experience_years: Number(formData.get("experienceYears") ?? 0),
        languages: parseCsv(formData.get("languages")),
        website_url: readOptionalText(formData, "websiteUrl"),
        facebook_url: readOptionalText(formData, "facebookUrl"),
        instagram_url: readOptionalText(formData, "instagramUrl"),
        linkedin_url: readOptionalText(formData, "linkedinUrl"),
        youtube_url: readOptionalText(formData, "youtubeUrl"),
        session_types: parseCsv(formData.get("sessionTypes")),
        price_per_hour_usd: Number(formData.get("pricePerHourUsd") ?? 0),
        currency: "USD",
        availability: JSON.parse(String(formData.get("availability") ?? "{}")),
        status: "pending",
        application_submitted_at: new Date().toISOString(),
      };

    const { data: coach, error: coachError } = await admin
      .from("coaches")
      .insert(coachPayload)
      .select()
      .single();

    if (coachError || !coach) {
      throw coachError || new Error("Unable to create coach profile.");
    }

    if (certificationFile instanceof File && certificationFile.size > 0) {
      const certificationPath = await uploadFileToBucket({
        bucket: "coach-documents",
        path: buildDocumentPath(userId, "certification", certificationFile),
        file: certificationFile,
      });

      const certificationPayload: CoachCertificationInsert = {
        coach_id: coach.id,
        certification_name: readOptionalText(formData, "certificationName") ?? "Certification",
        issuing_organisation: readOptionalText(formData, "issuingOrganisation") ?? "Unspecified",
        year_obtained: Number(formData.get("yearObtained") ?? 0) || null,
        certificate_number: readOptionalText(formData, "certificateNumber"),
        certificate_file_path: certificationPath,
      };

      await admin.from("coach_certifications").insert(certificationPayload);
    }

    const documentEntries = [
      ["government_id_front", governmentIdFront],
      ["government_id_back", governmentIdBack],
      ["proof_of_address", proofOfAddress],
      ["selfie_with_id", selfieWithId],
    ] as const;

    for (const [documentType, file] of documentEntries) {
      if (file instanceof File && file.size > 0) {
        const path = await uploadFileToBucket({
          bucket: "coach-documents",
          path: buildDocumentPath(userId, documentType, file),
          file,
        });

        const documentPayload: CoachDocumentInsert = {
          coach_id: coach.id,
          document_type: documentType,
          file_name: file.name,
          file_path: path,
          mime_type: file.type,
        };

        await admin.from("coach_documents").insert(documentPayload);
      }
    }

    await sendPlatformEmail({
      to: email,
      subject: "Your Mofitness coach application was submitted",
      category: "coach_application_submitted",
      html: `<div style="font-family:sans-serif;background:#0A0A0A;color:#F0F0F0;padding:24px">
        <h1 style="color:#C8F135">Application submitted</h1>
        <p>Thank you, ${fullName}. Your coach application is now under review.</p>
        <p>You can sign in to the coach portal immediately while your verification status is pending.</p>
      </div>`,
    });

    return NextResponse.json({
      message: "Application submitted. You can now sign in to the coach portal while review is pending.",
      coachId: coach.id,
      slug,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit coach application.",
      },
      { status: 500 },
    );
  }
}

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
      .eq("role", "admin")
      .maybeSingle();

    if (!role) {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = (await request.json()) as {
      coachId?: string;
      status?: string;
      verificationScore?: number;
      adminNotes?: string;
      rejectionReason?: string;
    };

    const nextStatus = parseCoachStatus(body.status);

    if (!body.coachId || !nextStatus) {
      return NextResponse.json({ error: "coachId and status are required." }, { status: 400 });
    }

    const { data: coach, error: coachError } = await admin
      .from("coaches")
      .update({
        status: nextStatus,
        verification_score: body.verificationScore ?? null,
        admin_notes: body.adminNotes ?? null,
        rejection_reason: body.rejectionReason ?? null,
        verified_at: nextStatus === "approved" ? new Date().toISOString() : null,
        rejected_at: nextStatus === "rejected" ? new Date().toISOString() : null,
      })
      .eq("id", body.coachId)
      .select()
      .single();

    if (coachError || !coach) {
      throw coachError || new Error("Unable to update coach.");
    }

    if ((coach as { email: string }).email) {
      await sendPlatformEmail({
        to: (coach as { email: string }).email,
        subject:
          nextStatus === "approved"
            ? "Your Mofitness coach profile is now approved"
            : "Update on your Mofitness coach application",
        category: "coach_review_decision",
        html: `<div style="font-family:sans-serif;background:#0A0A0A;color:#F0F0F0;padding:24px">
          <h1 style="color:#C8F135">${nextStatus === "approved" ? "Coach approved" : "Coach review update"}</h1>
          <p>Status: ${nextStatus}</p>
          <p>${body.rejectionReason ?? body.adminNotes ?? "You can sign in to review your coach portal status."}</p>
        </div>`,
      });
    }

    if (nextStatus === "approved") {
      let targetUserIds: string[] | undefined;
      const coachLat = Number((coach as { lat?: number | null }).lat ?? NaN);
      const coachLng = Number((coach as { lng?: number | null }).lng ?? NaN);

      if (Number.isFinite(coachLat) && Number.isFinite(coachLng)) {
        const { data: notifyProfiles } = await admin
          .from("web_user_profiles")
          .select("email, location_lat, location_lng, travel_radius_km, notify_new_coaches")
          .eq("notify_new_coaches", true)
          .not("location_lat", "is", null)
          .not("location_lng", "is", null);

        const nearbyEmails = (notifyProfiles ?? [])
          .filter((profile) => {
            const lat = Number(profile.location_lat ?? NaN);
            const lng = Number(profile.location_lng ?? NaN);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
              return false;
            }
            const distance = haversineDistanceKm({
              lat1: lat,
              lng1: lng,
              lat2: coachLat,
              lng2: coachLng,
            });
            const radiusKm = Number(profile.travel_radius_km ?? 25);
            return distance <= radiusKm;
          })
          .map((profile) => profile.email)
          .filter((value): value is string => typeof value === "string" && value.length > 0);

        if (nearbyEmails.length > 0) {
          const { data: users } = await admin
            .from("users")
            .select("id, email")
            .in("email", nearbyEmails);
          targetUserIds = (users ?? []).map((entry) => entry.id);
        } else {
          targetUserIds = [];
        }
      }

      await sendExpoPushNotifications({
        title: "A new coach joined Mofitness",
        body: `${(coach as { full_name: string }).full_name} is now available in ${(coach as { city: string }).city}.`,
        category: "new_coach_nearby",
        userIds: targetUserIds,
      });
    }

    return NextResponse.json({ coach });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update coach." },
      { status: 500 },
    );
  }
}
