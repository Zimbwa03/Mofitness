import { Resend } from "resend";

import { getServerEnv } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function getResendClient() {
  const env = getServerEnv();
  if (!env.resendApiKey) {
    return null;
  }

  return new Resend(env.resendApiKey);
}

export async function sendPlatformEmail(args: {
  to: string;
  subject: string;
  html: string;
  category: string;
}) {
  const env = getServerEnv();
  const resend = getResendClient();
  const admin = getSupabaseAdminClient();

  if (!resend) {
    await admin.from("notification_logs").insert({
      category: args.category,
      target_type: "email",
      recipient: args.to,
      payload: { subject: args.subject, skipped: true },
      status: "pending",
      error_message: "RESEND_API_KEY not configured",
    });
    return;
  }

  try {
    await resend.emails.send({
      from: env.resendFromEmail,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });

    await admin.from("notification_logs").insert({
      category: args.category,
      target_type: "email",
      recipient: args.to,
      payload: { subject: args.subject },
      status: "sent",
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    await admin.from("notification_logs").insert({
      category: args.category,
      target_type: "email",
      recipient: args.to,
      payload: { subject: args.subject },
      status: "failed",
      error_message: error instanceof Error ? error.message : "Email send failed",
    });
  }
}
