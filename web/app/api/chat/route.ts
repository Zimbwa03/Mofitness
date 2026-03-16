import { NextResponse } from "next/server";

import type { Database } from "@/lib/supabase/database";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type UserRoleRow = Database["public"]["Tables"]["user_roles"]["Row"];

async function getAuthenticatedUserContext() {
  const server = createSupabaseServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: roles } = await server
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return {
    user,
    roles: ((roles ?? []) as UserRoleRow[]).map((entry) => entry.role),
  };
}

export async function GET(request: Request) {
  const context = await getAuthenticatedUserContext();
  if (!context) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");

  if (conversationId) {
    const { data, error } = await admin
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data ?? [] });
  }

  const conversationQuery = admin
    .from("conversations")
    .select("*")
    .order("last_msg_at", { ascending: false });

  let data: unknown[] | null = null;
  let error: Error | null = null;

  if (context.roles.includes("coach")) {
    const coachRows = await admin
      .from("coaches")
      .select("id")
      .eq("user_id", context.user.id);

    const coachIds = coachRows.data?.map((coach) => coach.id) ?? [];
    if (coachIds.length) {
      const response = await conversationQuery.in("coach_id", coachIds);
      data = response.data;
      error = response.error;
    } else {
      data = [];
    }
  } else {
    const response = await conversationQuery.eq("user_id", context.user.id);
    data = response.data;
    error = response.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: data ?? [] });
}

export async function POST(request: Request) {
  try {
    const context = await getAuthenticatedUserContext();
    if (!context) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();
    const body = (await request.json()) as Record<string, unknown>;
    const conversationId = body.conversationId ? String(body.conversationId) : null;
    const coachId = body.coachId ? String(body.coachId) : null;
    const bodyText = String(body.body ?? "").trim();

    if (!bodyText) {
      return NextResponse.json({ error: "Message body is required." }, { status: 400 });
    }

    let resolvedConversationId = conversationId;

    if (!resolvedConversationId && coachId) {
      const existing = await admin
        .from("conversations")
        .select("*")
        .eq("coach_id", coachId)
        .eq("user_id", context.user.id)
        .maybeSingle();

      if (existing.data) {
        resolvedConversationId = existing.data.id as string;
      } else {
        const created = await admin
          .from("conversations")
          .insert({
            coach_id: coachId,
            user_id: context.user.id,
          })
          .select()
          .single();

        if (created.error || !created.data) {
          throw created.error || new Error("Unable to create conversation.");
        }

        resolvedConversationId = created.data.id as string;
      }
    }

    if (!resolvedConversationId) {
      return NextResponse.json({ error: "conversationId or coachId is required." }, { status: 400 });
    }

    let senderType: "user" | "coach" = "user";
    if (context.roles.includes("coach")) {
      const ownedCoach = await admin
        .from("coaches")
        .select("id")
        .eq("user_id", context.user.id)
        .maybeSingle();

      if (ownedCoach.data) {
        const conversation = await admin
          .from("conversations")
          .select("coach_id")
          .eq("id", resolvedConversationId)
          .maybeSingle();

        if (conversation.data?.coach_id === ownedCoach.data.id) {
          senderType = "coach";
        }
      }
    }

    const { data, error } = await admin
      .from("messages")
      .insert({
        conversation_id: resolvedConversationId,
        sender_id: context.user.id,
        sender_type: senderType,
        body: bodyText,
        attachments: [],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send message." },
      { status: 500 },
    );
  }
}
