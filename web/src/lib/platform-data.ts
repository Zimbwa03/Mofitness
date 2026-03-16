import { format } from "date-fns";

import type {
  CoachFilters,
  CoachRecord,
  ConversationRecord,
  FitnessEventRecord,
  MatchingResult,
  MessageRecord,
} from "@shared/features/findCoach/shared/types";
import { applyCoachFilters } from "@shared/features/findCoach/shared/filters";

import { hasSupabaseAdminEnv } from "./env";
import { getSupabaseAdminClient } from "./supabase/admin";

export const marketingFeatures = [
  {
    title: "AI Workout Coach",
    description: "Mo guides each rep, session block, and progression cycle.",
  },
  {
    title: "Real-Time Form Check",
    description: "Camera-powered technique scoring with clear next cues.",
  },
  {
    title: "AI Nutrition Plans",
    description: "Daily meals generated around local cuisines and goals.",
  },
  {
    title: "GPS Run Tracking",
    description: "Track routes, discover new loops, and review splits.",
  },
  {
    title: "Find A Coach",
    description: "Verified coaches on a live map with instant matching.",
  },
  {
    title: "Fitness Events",
    description: "Bootcamps, races, and community training in your city.",
  },
] as const;

export const testimonials = [
  {
    name: "Rutendo M.",
    country: "Zimbabwe",
    quote: "I moved from random workouts to a plan that finally fit my life and culture.",
  },
  {
    name: "Chinedu O.",
    country: "Nigeria",
    quote: "The coach network made Mofitness feel real. I found support close to me fast.",
  },
  {
    name: "Amina K.",
    country: "Kenya",
    quote: "The app, the events, and the coaching all feel like one connected system.",
  },
] as const;

const ADMIN_VISIBLE_COACH_STATUSES: Array<Exclude<CoachRecord["status"], "draft">> = [
  "pending",
  "under_review",
  "approved",
  "rejected",
  "suspended",
  "more_info_required",
];
const PLATFORM_QUERY_TIMEOUT_MS = 8000;

function canReadPlatformData() {
  return hasSupabaseAdminEnv();
}

async function withPlatformTimeout<T>(query: PromiseLike<T>, fallback: T): Promise<T> {
  try {
    return (await Promise.race([
      query,
      new Promise<T>((resolve) => {
        setTimeout(() => resolve(fallback), PLATFORM_QUERY_TIMEOUT_MS);
      }),
    ])) as T;
  } catch {
    return fallback;
  }
}

export async function getApprovedCoaches(filters?: CoachFilters) {
  if (!canReadPlatformData()) {
    return [];
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await withPlatformTimeout(
    admin
      .from("coaches")
      .select("*")
      .eq("status", "approved")
      .order("is_featured", { ascending: false }),
    { data: [], error: null } as unknown as {
      data: unknown[] | null;
      error: unknown | null;
    },
  );
  if (error) return [];

  const coaches = (data ?? []) as unknown as CoachRecord[];
  if (!filters) {
    return coaches;
  }

  return applyCoachFilters(coaches, filters).map((entry) => ({
    ...entry.coach,
    distance_km: entry.distanceKm,
  }));
}

export async function getCoachBySlug(slug: string) {
  if (!canReadPlatformData()) {
    return {
      coach: null,
      reviews: [],
      certifications: [],
    };
  }

  const admin = getSupabaseAdminClient();
  const { data: bySlug, error: coachError } = await admin
    .from("coaches")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (coachError) {
    throw coachError;
  }

  const coach =
    bySlug ??
    (await admin
      .from("coaches")
      .select("*")
      .eq("id", slug)
      .maybeSingle()).data;

  if (!coach) {
    return {
      coach: null,
      reviews: [],
      certifications: [],
    };
  }

  const [{ data: reviews }, { data: certifications }] = await Promise.all([
    admin.from("coach_reviews").select("*").eq("coach_id", coach.id),
    admin.from("coach_certifications").select("*").eq("coach_id", coach.id),
  ]);

  return {
    coach: coach as CoachRecord,
    reviews: (reviews ?? []) as unknown[],
    certifications: (certifications ?? []) as unknown[],
  };
}

export async function getCoachById(id: string) {
  if (!canReadPlatformData()) {
    return {
      coach: null,
      reviews: [],
      certifications: [],
    };
  }

  const admin = getSupabaseAdminClient();
  const { data: coach, error: coachError } = await admin
    .from("coaches")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (coachError) {
    throw coachError;
  }

  if (!coach) {
    return {
      coach: null,
      reviews: [],
      certifications: [],
    };
  }

  const [{ data: reviews }, { data: certifications }] = await Promise.all([
    admin.from("coach_reviews").select("*").eq("coach_id", coach.id),
    admin.from("coach_certifications").select("*").eq("coach_id", coach.id),
  ]);

  return {
    coach: coach as CoachRecord,
    reviews: (reviews ?? []) as unknown[],
    certifications: (certifications ?? []) as unknown[],
  };
}

export async function getPublishedEvents() {
  if (!canReadPlatformData()) {
    return [];
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await withPlatformTimeout(
    admin
      .from("fitness_events")
      .select("*")
      .eq("status", "published")
      .order("starts_at", { ascending: true }),
    { data: [], error: null } as unknown as {
      data: unknown[] | null;
      error: unknown | null;
    },
  );
  if (error) return [];

  return (data ?? []) as unknown as FitnessEventRecord[];
}

export async function getEventBySlug(slug: string) {
  if (!canReadPlatformData()) {
    return null;
  }

  const admin = getSupabaseAdminClient();
  const { data: bySlug, error } = await admin
    .from("fitness_events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const event =
    bySlug ??
    (await admin
      .from("fitness_events")
      .select("*")
      .eq("id", slug)
      .maybeSingle()).data;

  return (event ?? null) as FitnessEventRecord | null;
}

export async function getEventById(id: string) {
  if (!canReadPlatformData()) {
    return null;
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("fitness_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as FitnessEventRecord | null;
}

export async function getCoachPortalSnapshot(userId: string) {
  if (!canReadPlatformData()) {
    return {
      coach: null,
      conversations: [],
    };
  }

  const admin = getSupabaseAdminClient();
  const { data: coach } = await admin
    .from("coaches")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: conversations } = coach
    ? await admin
        .from("conversations")
        .select("*")
        .eq("coach_id", coach.id)
        .order("last_msg_at", { ascending: false })
        .limit(10)
    : { data: [] };

  return {
    coach: (coach ?? null) as CoachRecord | null,
    conversations: (conversations ?? []) as unknown as ConversationRecord[],
  };
}

export async function getCoachPortalClients(userId: string) {
  if (!canReadPlatformData()) {
    return [];
  }

  const admin = getSupabaseAdminClient();
  const { data: coach } = await admin
    .from("coaches")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!coach) {
    return [];
  }

  const { data: matches, error } = await admin
    .from("coach_matches")
    .select("*")
    .eq("coach_id", coach.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  const userIds = (matches ?? [])
    .map((entry) => entry.user_id)
    .filter((value): value is string => Boolean(value));
  const webProfileIds = (matches ?? [])
    .map((entry) => entry.web_profile_id)
    .filter((value): value is string => Boolean(value));

  const [{ data: users }, { data: webProfiles }] = await Promise.all([
    userIds.length
      ? admin
          .from("users")
          .select("id, full_name, email")
          .in("id", userIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string; email: string }> }),
    webProfileIds.length
      ? admin
          .from("web_user_profiles")
          .select("id, full_name, email")
          .in("id", webProfileIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string | null; email: string }> }),
  ]);

  return (matches ?? []).map((entry) => {
    const user = users?.find((row) => row.id === entry.user_id) ?? null;
    const webProfile = webProfiles?.find((row) => row.id === entry.web_profile_id) ?? null;
    return {
      id: entry.id,
      created_at: entry.created_at,
      status: entry.status,
      match_score: entry.match_score,
      source: entry.user_id ? "mobile" : "web",
      name: user?.full_name ?? webProfile?.full_name ?? "Unknown",
      email: user?.email ?? webProfile?.email ?? "Unknown",
      concern_notes: entry.concern_notes,
    };
  });
}

export async function getCoachPortalEarnings(userId: string) {
  if (!canReadPlatformData()) {
    return {
      hourlyRate: 0,
      activeClients: 0,
      completedClients: 0,
      contactedLeads: 0,
      estimatedMonthlyRevenue: 0,
      responseRatePct: 0,
    };
  }

  const admin = getSupabaseAdminClient();
  const { data: coach } = await admin
    .from("coaches")
    .select("id, price_per_hour_usd, response_rate_pct")
    .eq("user_id", userId)
    .maybeSingle();

  if (!coach) {
    return {
      hourlyRate: 0,
      activeClients: 0,
      completedClients: 0,
      contactedLeads: 0,
      estimatedMonthlyRevenue: 0,
      responseRatePct: 0,
    };
  }

  const [active, completed, contacted] = await Promise.all([
    admin
      .from("coach_matches")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", coach.id)
      .eq("status", "active"),
    admin
      .from("coach_matches")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", coach.id)
      .eq("status", "completed"),
    admin
      .from("coach_matches")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", coach.id)
      .eq("status", "contacted"),
  ]);

  const hourlyRate = Number(coach.price_per_hour_usd ?? 0);
  const activeClients = active.count ?? 0;
  const completedClients = completed.count ?? 0;
  const contactedLeads = contacted.count ?? 0;
  const estimatedMonthlyRevenue = Math.round((activeClients * 8 + completedClients * 2) * hourlyRate);

  return {
    hourlyRate,
    activeClients,
    completedClients,
    contactedLeads,
    estimatedMonthlyRevenue,
    responseRatePct: Number(coach.response_rate_pct ?? 0),
  };
}

export async function getCoachPortalSchedule(userId: string) {
  if (!canReadPlatformData()) {
    return { availability: {}, events: [] as FitnessEventRecord[] };
  }

  const admin = getSupabaseAdminClient();
  const { data: coach } = await admin
    .from("coaches")
    .select("availability")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: events } = await admin
    .from("fitness_events")
    .select("*")
    .eq("organiser_id", userId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(10);

  return {
    availability: (coach?.availability as Record<string, unknown> | null) ?? {},
    events: (events ?? []) as unknown as FitnessEventRecord[],
  };
}

export async function getUserConversations(userId: string) {
  if (!canReadPlatformData()) {
    return [];
  }

  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("last_msg_at", { ascending: false });

  return (data ?? []) as unknown as ConversationRecord[];
}

export async function getCoachCountsByStatus() {
  if (!canReadPlatformData()) {
    return {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
    };
  }

  const admin = getSupabaseAdminClient();
  const rows = await Promise.all(
    (["pending", "under_review", "approved", "rejected"] as const).map(async (status) => {
      const { count } = await admin
        .from("coaches")
        .select("id", { count: "exact", head: true })
        .eq("status", status);

      return [status, count ?? 0] as const;
    }),
  );

  return Object.fromEntries(rows);
}

export async function getAdminOverview() {
  if (!canReadPlatformData()) {
    return {
      pendingCoaches: 0,
      approvedCoaches: 0,
      liveEvents: 0,
      totalUsers: 0,
    };
  }

  const admin = getSupabaseAdminClient();
  const [pendingCoaches, approvedCoaches, liveEvents, totalUsers] = await Promise.all([
    admin.from("coaches").select("id", { count: "exact", head: true }).in("status", ["pending", "under_review"]),
    admin.from("coaches").select("id", { count: "exact", head: true }).eq("status", "approved"),
    admin.from("fitness_events").select("id", { count: "exact", head: true }).eq("status", "published"),
    admin.from("users").select("id", { count: "exact", head: true }),
  ]);

  return {
    pendingCoaches: pendingCoaches.count ?? 0,
    approvedCoaches: approvedCoaches.count ?? 0,
    liveEvents: liveEvents.count ?? 0,
    totalUsers: totalUsers.count ?? 0,
  };
}

export async function getAdminCoachApplications() {
  if (!canReadPlatformData()) {
    return [];
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("coaches")
    .select("*")
    .in("status", ADMIN_VISIBLE_COACH_STATUSES)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as CoachRecord[];
}

export async function getAdminEvents() {
  if (!canReadPlatformData()) {
    return [];
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("fitness_events")
    .select("*")
    .order("starts_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as FitnessEventRecord[];
}

export async function getAdminUsers() {
  if (!canReadPlatformData()) {
    return { totalUsers: 0, users: [] as Array<Record<string, unknown>> };
  }

  const admin = getSupabaseAdminClient();
  const [total, rows] = await Promise.all([
    admin.from("users").select("id", { count: "exact", head: true }),
    admin
      .from("users")
      .select("id, full_name, email, created_at, onboarding_completed, points, notifications_enabled")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return {
    totalUsers: total.count ?? 0,
    users: rows.data ?? [],
  };
}

export async function getAdminAnalytics() {
  if (!canReadPlatformData()) {
    return {
      totalConversations: 0,
      messages30d: 0,
      matches30d: 0,
      eventRegistrations30d: 0,
      pushSent30d: 0,
    };
  }

  const admin = getSupabaseAdminClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [conversations, messages, matches, registrations, pushLogs] = await Promise.all([
    admin.from("conversations").select("id", { count: "exact", head: true }),
    admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    admin
      .from("coach_matches")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    admin
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .gte("registered_at", since),
    admin
      .from("notification_logs")
      .select("id", { count: "exact", head: true })
      .eq("target_type", "push")
      .eq("status", "sent")
      .gte("created_at", since),
  ]);

  return {
    totalConversations: conversations.count ?? 0,
    messages30d: messages.count ?? 0,
    matches30d: matches.count ?? 0,
    eventRegistrations30d: registrations.count ?? 0,
    pushSent30d: pushLogs.count ?? 0,
  };
}

export async function getConversationMessages(conversationId: string) {
  if (!canReadPlatformData()) {
    return [];
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as MessageRecord[];
}

export function formatEventDate(value: string) {
  return format(new Date(value), "EEE, d MMM yyyy");
}

export function formatEventDateTime(value: string) {
  return format(new Date(value), "EEE, d MMM yyyy 'at' HH:mm");
}

export function flattenMatchReasons(result: MatchingResult) {
  return result.reasons.join(" ");
}
