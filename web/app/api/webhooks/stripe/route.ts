import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getServerEnv } from "@/lib/env";
import { sendPlatformEmail } from "@/lib/email/resend";
import { getStripeClient } from "@/lib/stripe/client";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const env = getServerEnv();
  const stripe = getStripeClient();

  if (!stripe || !env.stripeWebhookSecret) {
    return NextResponse.json({ received: true });
  }

  const body = await request.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.stripeWebhookSecret,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid signature." },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const registrationId = session.metadata?.registrationId;
    if (registrationId) {
      const admin = getSupabaseAdminClient();
      const { data: registration } = await admin
        .from("event_registrations")
        .update({
          payment_status: "paid",
          stripe_session: session.id,
          stripe_payment_intent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
        })
        .eq("id", registrationId)
        .select()
        .single();

      if (registration) {
        await sendPlatformEmail({
          to: String((registration as { email: string }).email),
          subject: "Your Mofitness event ticket is confirmed",
          category: "event_ticket_paid",
          html: `<div style="font-family:sans-serif;background:#0A0A0A;color:#F0F0F0;padding:24px">
            <h1 style="color:#C8F135">Ticket confirmed</h1>
            <p>Your ticket code is ${(registration as { ticket_code: string }).ticket_code}.</p>
          </div>`,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
