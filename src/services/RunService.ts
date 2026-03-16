import AsyncStorage from "@react-native-async-storage/async-storage";

import type { RunRecord, RunSession, RunSummarySnapshot, SavedRoute, WeeklyRunSummary } from "../models";
import supabaseService from "./SupabaseService";

interface SaveRunSessionInput {
  userId: string;
  activityType: RunSession["activity_type"];
  startedAt: string;
  endedAt: string;
  summary: RunSummarySnapshot;
  routePoints: RunSession["route_polyline"];
  kmSplits: RunSession["km_splits"];
  targetDistanceM?: number | null;
  targetDurationS?: number | null;
  targetPaceSecKm?: number | null;
  routeName?: string | null;
}

class RunService {
  private client = supabaseService.getClient();
  private readonly offlineQueueKey = "offline_run_sessions_queue";

  private isConnectivityError(error: unknown) {
    if (!(error instanceof Error)) {
      return false;
    }
    const message = error.message.toLowerCase();
    return (
      message.includes("internet") ||
      message.includes("network") ||
      message.includes("timed out") ||
      message.includes("unable to reach") ||
      message.includes("failed to fetch")
    );
  }

  private async queueOfflineRunSession(payload: Record<string, unknown>) {
    const raw = await AsyncStorage.getItem(this.offlineQueueKey);
    const queue = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
    queue.push(payload);
    await AsyncStorage.setItem(this.offlineQueueKey, JSON.stringify(queue));
  }

  async getWeeklySummary(userId: string, weekStartISO: string): Promise<WeeklyRunSummary> {
    const weekStart = new Date(weekStartISO);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const { data, error } = await this.client
      .from("run_sessions")
      .select("distance_meters,total_steps,calories_burned")
      .eq("user_id", userId)
      .gte("started_at", weekStart.toISOString())
      .lt("started_at", weekEnd.toISOString())
      .returns<Array<{ distance_meters: number | null; total_steps: number | null; calories_burned: number | null }>>();

    if (error) {
      throw error;
    }

    const summary = data.reduce(
      (acc, item) => {
        acc.runs += 1;
        acc.distanceMeters += item.distance_meters ?? 0;
        acc.steps += item.total_steps ?? 0;
        acc.calories += item.calories_burned ?? 0;
        return acc;
      },
      { runs: 0, distanceMeters: 0, steps: 0, calories: 0, weeklyGoalMeters: 20000 },
    );

    return summary;
  }

  async getRecentRuns(userId: string, limit = 20): Promise<RunSession[]> {
    const { data, error } = await this.client
      .from("run_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit)
      .returns<RunSession[]>();

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async saveRunSession(input: SaveRunSessionInput): Promise<RunSession> {
    const payload = {
      user_id: input.userId,
      activity_type: input.activityType,
      started_at: input.startedAt,
      ended_at: input.endedAt,
      duration_seconds: input.summary.durationSeconds,
      distance_meters: input.summary.distanceMeters,
      avg_pace_sec_per_km: input.summary.avgPaceSecPerKm || null,
      best_pace_sec_per_km: input.summary.bestPaceSecPerKm || null,
      total_steps: input.summary.totalSteps,
      calories_burned: input.summary.caloriesBurned,
      avg_heart_rate_bpm: input.summary.avgHeartRateBpm,
      elevation_gain_m: input.summary.elevationGainM,
      route_polyline: input.routePoints,
      km_splits: input.kmSplits,
      target_distance_m: input.targetDistanceM ?? null,
      target_duration_s: input.targetDurationS ?? null,
      target_pace_sec_km: input.targetPaceSecKm ?? null,
      route_name: input.routeName ?? null,
      goal_achieved:
        (input.targetDistanceM ?? 0) > 0
          ? input.summary.distanceMeters >= (input.targetDistanceM ?? 0)
          : (input.targetDurationS ?? 0) > 0
            ? input.summary.durationSeconds >= (input.targetDurationS ?? 0)
            : false,
    };

    const { data, error } = await this.client.from("run_sessions").insert(payload).select("*").single<RunSession>();

    if (error) {
      if (this.isConnectivityError(error)) {
        await this.queueOfflineRunSession(payload);
        return {
          ...payload,
          id: `offline_${Date.now()}`,
          ended_at: payload.ended_at ?? null,
          duration_seconds: payload.duration_seconds ?? null,
          distance_meters: payload.distance_meters ?? null,
          elevation_gain_m: payload.elevation_gain_m ?? null,
          elevation_loss_m: null,
          avg_pace_sec_per_km: payload.avg_pace_sec_per_km ?? null,
          best_pace_sec_per_km: payload.best_pace_sec_per_km ?? null,
          avg_speed_kmh: null,
          max_speed_kmh: null,
          total_steps: payload.total_steps ?? null,
          avg_cadence_spm: null,
          avg_stride_length_m: null,
          avg_heart_rate_bpm: payload.avg_heart_rate_bpm ?? null,
          max_heart_rate_bpm: null,
          calories_burned: payload.calories_burned ?? null,
          route_polyline: payload.route_polyline as RunSession["route_polyline"],
          start_lat: null,
          start_lng: null,
          end_lat: null,
          end_lng: null,
          route_name: payload.route_name ?? null,
          country_code: null,
          city: null,
          target_distance_m: payload.target_distance_m ?? null,
          target_duration_s: payload.target_duration_s ?? null,
          target_pace_sec_km: payload.target_pace_sec_km ?? null,
          goal_achieved: Boolean(payload.goal_achieved),
          km_splits: payload.km_splits as RunSession["km_splits"],
          interval_config: null,
          interval_results: null,
          ai_coaching_notes: null,
          perceived_effort: null,
          mood_after: null,
          notes: null,
          is_public: false,
          cover_photo_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as RunSession;
      }
      throw error;
    }

    return data;
  }

  async getRoutesNearMe(countryCode: string, city?: string): Promise<SavedRoute[]> {
    const query = this.client
      .from("saved_routes")
      .select("*")
      .eq("country_code", countryCode)
      .order("times_run", { ascending: false })
      .limit(30);

    const { data, error } = city
      ? await query.eq("city", city).returns<SavedRoute[]>()
      : await query.returns<SavedRoute[]>();

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async upsertRunRecord(input: Omit<RunRecord, "id" | "created_at">): Promise<void> {
    const { error } = await this.client.from("run_records").upsert(input);
    if (error) {
      throw error;
    }
  }

  async syncQueuedRuns() {
    const raw = await AsyncStorage.getItem(this.offlineQueueKey);
    const queue = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
    if (queue.length === 0) {
      return;
    }

    const remaining: Record<string, unknown>[] = [];
    for (const payload of queue) {
      const { error } = await this.client.from("run_sessions").insert(payload);
      if (error) {
        if (this.isConnectivityError(error)) {
          remaining.push(payload);
          break;
        }
        remaining.push(payload);
      }
    }
    await AsyncStorage.setItem(this.offlineQueueKey, JSON.stringify(remaining));
  }
}

const runService = new RunService();

export default runService;
