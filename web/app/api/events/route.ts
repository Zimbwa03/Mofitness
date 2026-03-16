import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database";
import { getStripeClient } from "@/lib/stripe/client";
import { sendPlatformEmail } from "@/lib/email/resend";

type EventInsert = Database["public"]["Tables"]["fitness_events"]["Insert"];
type EventRegistrationInsert = Database["public"]["Tables"]["event_registrations"]["Insert"];
type EventStatus = Database["public"]["Tables"]["fitness_events"]["Row"]["status"];

const EVENT_STATUSES: EventStatus[] = ["draft", "published", "cancelled", "completed"];

function buildEventTicketCode() {
  return `MOF-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function readRequiredString(body: Record<string, unknown>, key: string) {
  return String(body[key] ?? "").trim();
}

function readOptionalString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function readStringArray(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];
}

function parseEventStatus(value: unknown): EventStatus {
  return typeof value === "string" && EVENT_STATUSES.includes(value as EventStatus)
    ? (value as EventStatus)
    : "draft";
}

export async function GET() {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("fitness_events")
    .select("*")
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const admin = getSupabaseAdminClient();
    const serverClient = createSupabaseServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "register");

    if (action === "create") {
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

      const title = String(body.title ?? "").trim();
      if (!title) {
        return NextResponse.json({ error: "Title is required." }, { status: 400 });
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const eventPayload: EventInsert = {
          slug: `${slug}-${Date.now().toString().slice(-6)}`,
          title,
          description: readRequiredString(body, "description"),
          event_type: readRequiredString(body, "event_type") || "bootcamp",
          city: readRequiredString(body, "city"),
          country: readRequiredString(body, "country"),
          venue_name: readOptionalString(body, "venue_name"),
          address: readOptionalString(body, "address"),
          starts_at: readRequiredString(body, "starts_at"),
          ends_at: readRequiredString(body, "ends_at"),
          registration_deadline: readOptionalString(body, "registration_deadline"),
          capacity: body.capacity ? Number(body.capacity) : null,
          spots_remaining: body.capacity ? Number(body.capacity) : null,
          is_free: Boolean(body.is_free),
          price_usd: body.price_usd ? Number(body.price_usd) : null,
          difficulty_level: readOptionalString(body, "difficulty_level"),
          tags: readStringArray(body, "tags"),
          status: parseEventStatus(body.status),
          organiser_id: user.id,
        };

      const { data, error } = await admin
        .from("fitness_events")
        .insert(eventPayload)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({ event: data });
    }

    const eventId = String(body.eventId ?? "");
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required." }, { status: 400 });
    }

    const { data: event, error: eventError } = await admin
      .from("fitness_events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (!(event as { is_free: boolean }).is_free && !user) {
      return NextResponse.json({ error: "Sign in is required for paid event registration." }, { status: 401 });
    }

    const registration: EventRegistrationInsert = {
      event_id: eventId,
      user_id: user?.id ?? null,
      full_name: readRequiredString(body, "full_name"),
      email: readRequiredString(body, "email"),
      phone: readOptionalString(body, "phone"),
      emergency_contact_name: readOptionalString(body, "emergency_contact_name"),
      emergency_contact_phone: readOptionalString(body, "emergency_contact_phone"),
      medical_conditions: readOptionalString(body, "medical_conditions"),
      tshirt_size: readOptionalString(body, "tshirt_size"),
      payment_status: (event as { is_free: boolean }).is_free ? "free" : "pending",
      ticket_code: buildEventTicketCode(),
    };

    const { data: inserted, error: registrationError } = await admin
      .from("event_registrations")
      .insert(registration)
      .select()
      .single();

    if (registrationError || !inserted) {
      throw registrationError || new Error("Unable to create registration.");
    }

    if ((event as { is_free: boolean }).is_free) {
      await sendPlatformEmail({
        to: String(body.email),
        subject: `You're registered for ${(event as { title: string }).title}`,
        category: "event_registration",
        html: `<div style="font-family:sans-serif;background:#0A0A0A;color:#F0F0F0;padding:24px">
          <h1 style="color:#C8F135">Registration confirmed</h1>
          <p>Your ticket code is ${(inserted as { ticket_code: string }).ticket_code}.</p>
        </div>`,
      });

      return NextResponse.json({ registration: inserted, checkoutUrl: null });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured for paid events." },
        { status: 500 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/events/${(event as { slug: string }).slug}?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/events/${(event as { slug: string }).slug}?cancelled=1`,
      customer_email: String(body.email),
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: (event as { title: string }).title,
            },
            unit_amount: Math.round(Number((event as { price_usd?: number | null }).price_usd ?? 0) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        registrationId: String((inserted as { id: string }).id),
        eventId,
      },
    });

    await admin
      .from("event_registrations")
      .update({ stripe_session: session.id })
      .eq("id", (inserted as { id: string }).id);

    return NextResponse.json({ registration: inserted, checkoutUrl: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process event request." },
      { status: 500 },
    );
  }
}
