import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "../supabase/server";

export async function requireUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!data) {
    redirect("/");
  }

  return user;
}

export async function requireCoach() {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "coach")
    .maybeSingle();

  if (!data) {
    redirect("/");
  }

  return user;
}
