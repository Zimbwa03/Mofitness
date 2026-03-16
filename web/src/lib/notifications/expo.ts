import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function sendExpoPushNotifications(args: {
  title: string;
  body: string;
  userIds?: string[];
  category: string;
}) {
  const admin = getSupabaseAdminClient();
  if (args.userIds && args.userIds.length === 0) {
    return;
  }
  let query = admin
    .from("users")
    .select("id, push_token, notifications_enabled")
    .eq("notifications_enabled", true)
    .not("push_token", "is", null);

  if (args.userIds?.length) {
    query = query.in("id", args.userIds);
  }

  const { data: users } = await query;
  const tokens = (users ?? [])
    .flatMap((user) => (typeof user.push_token === "string" ? [{ userId: user.id, token: user.push_token }] : []));

  if (!tokens.length) {
    return;
  }

  const chunks = tokens.map((item) => ({
    to: item.token,
    sound: "default",
    title: args.title,
    body: args.body,
  }));

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chunks),
    });

    await Promise.all(
      tokens.map((item) =>
        admin.from("notification_logs").insert({
          category: args.category,
          target_type: "push",
          recipient: item.userId,
          payload: { title: args.title, body: args.body, token: item.token },
          status: "sent",
          processed_at: new Date().toISOString(),
        }),
      ),
    );
  } catch (error) {
    await Promise.all(
      tokens.map((item) =>
        admin.from("notification_logs").insert({
          category: args.category,
          target_type: "push",
          recipient: item.userId,
          payload: { title: args.title, body: args.body, token: item.token },
          status: "failed",
          error_message: error instanceof Error ? error.message : "Push send failed",
        }),
      ),
    );
  }
}
