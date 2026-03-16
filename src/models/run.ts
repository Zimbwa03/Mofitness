export type RunActivityType =
  | "outdoor_run"
  | "walk"
  | "power_walk"
  | "outdoor_cycle"
  | "treadmill"
  | "trail_run"
  | "interval_run";

export type RunPhase = "idle" | "countdown" | "warmup" | "active" | "paused" | "completed";

export interface RoutePoint {
  lat: number;
  lng: number;
  alt: number;
  timestamp: number;
  speed: number;
  accuracy: number;
  heading?: number;
  heartRate?: number;
}

export interface KmSplit {
  km: number;
  paceSec: number;
  hr: number | null;
  elevation: number;
  timestamp: number;
}

export interface RunTarget {
  mode: "distance" | "time" | "open";
  distanceMeters?: number;
  durationSeconds?: number;
  paceSecPerKm?: number;
}

export interface RunConfig {
  activityType: RunActivityType;
  target: RunTarget;
  routeId?: string;
  routeName?: string;
  aiCoachingEnabled: boolean;
  coachingFrequency: "every_km" | "every_2km" | "custom";
  warmupEnabled: boolean;
}

export interface RunSession {
  id: string;
  user_id: string;
  activity_type: RunActivityType;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  elevation_gain_m: number | null;
  elevation_loss_m: number | null;
  avg_pace_sec_per_km: number | null;
  best_pace_sec_per_km: number | null;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
  total_steps: number | null;
  avg_cadence_spm: number | null;
  avg_stride_length_m: number | null;
  avg_heart_rate_bpm: number | null;
  max_heart_rate_bpm: number | null;
  calories_burned: number | null;
  route_polyline: RoutePoint[];
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  route_name: string | null;
  country_code: string | null;
  city: string | null;
  target_distance_m: number | null;
  target_duration_s: number | null;
  target_pace_sec_km: number | null;
  goal_achieved: boolean;
  km_splits: KmSplit[];
  interval_config: Record<string, unknown> | null;
  interval_results: Record<string, unknown> | null;
  ai_coaching_notes: string | null;
  perceived_effort: number | null;
  mood_after: string | null;
  notes: string | null;
  is_public: boolean;
  cover_photo_url: string | null;
  created_at: string;
}

export interface SavedRoute {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  route_polyline: RoutePoint[];
  distance_meters: number | null;
  elevation_gain_m: number | null;
  difficulty: "easy" | "moderate" | "hard" | null;
  surface: string | null;
  country_code: string;
  city: string | null;
  start_lat: number | null;
  start_lng: number | null;
  times_run: number;
  avg_rating: number;
  is_ai_suggested: boolean;
  is_public: boolean;
  tags: string[];
  created_at: string;
}

export interface RunRecord {
  id: string;
  user_id: string;
  record_type: "1km" | "5km" | "10km" | "21km" | "42km" | "fastest_pace" | "longest_run" | "best_streak";
  value: number;
  unit: "seconds" | "meters";
  session_id: string | null;
  achieved_at: string;
  created_at: string;
}

export interface RunSummarySnapshot {
  distanceMeters: number;
  durationSeconds: number;
  avgPaceSecPerKm: number;
  bestPaceSecPerKm: number;
  caloriesBurned: number;
  totalSteps: number;
  avgHeartRateBpm: number | null;
  elevationGainM: number;
  kmSplits: KmSplit[];
}

export interface WeeklyRunSummary {
  runs: number;
  distanceMeters: number;
  steps: number;
  calories: number;
  weeklyGoalMeters: number;
}
