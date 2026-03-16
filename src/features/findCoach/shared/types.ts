export const COACH_SPECIALISATIONS = [
  "weight_loss",
  "muscle_gain",
  "sports_performance",
  "injury_rehabilitation",
  "nutrition_coaching",
  "running_endurance",
  "flexibility_mobility",
  "youth_fitness",
  "senior_fitness",
  "pre_postnatal",
  "group_fitness",
  "bodybuilding",
  "crossfit",
  "yoga_mindfulness",
  "boxing_combat",
] as const;

export const COACH_SESSION_TYPES = [
  "in_person",
  "virtual",
  "group",
  "corporate",
  "home_visits",
] as const;

export const COACH_SORT_OPTIONS = [
  "best_match",
  "nearest",
  "highest_rated",
  "most_reviewed",
  "price_low_to_high",
] as const;

export type CoachSpecialisation = (typeof COACH_SPECIALISATIONS)[number];
export type CoachSessionType = (typeof COACH_SESSION_TYPES)[number];
export type CoachSortOption = (typeof COACH_SORT_OPTIONS)[number];

export interface CoachRecord {
  id: string;
  user_id: string;
  slug: string;
  full_name: string;
  email: string;
  phone?: string | null;
  profile_photo_url?: string | null;
  cover_photo_url?: string | null;
  bio: string;
  tagline?: string | null;
  country: string;
  city: string;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  radius_km: number;
  specialisations: string[];
  experience_years: number;
  languages: string[];
  website_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  youtube_url?: string | null;
  session_types: string[];
  price_per_hour_usd?: number | null;
  currency: string;
  availability: Record<string, unknown>;
  package_summary?: string | null;
  status: "draft" | "pending" | "under_review" | "approved" | "rejected" | "suspended" | "more_info_required";
  verification_score?: number | null;
  application_submitted_at?: string | null;
  verified_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  admin_notes?: string | null;
  total_clients: number;
  avg_rating: number;
  total_reviews: number;
  response_rate_pct: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CoachFilters {
  search?: string;
  specialisations?: string[];
  sessionTypes?: string[];
  maxPriceUsd?: number | null;
  minRating?: number | null;
  sort?: CoachSortOption;
  userLat?: number | null;
  userLng?: number | null;
  radiusKm?: number | null;
}

export interface MatchingProfile {
  email: string;
  full_name?: string;
  age?: number | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  bmi?: number | null;
  bmi_category?: string | null;
  bmr?: number | null;
  tdee?: number | null;
  daily_calorie_target?: number | null;
  fitness_goal?: string | null;
  fitness_level?: string | null;
  injuries?: string[];
  preferred_session?: string | null;
  budget_per_session_usd?: number | null;
  location_lat?: number | null;
  location_lng?: number | null;
  city?: string | null;
  country?: string | null;
  travel_radius_km?: number | null;
  send_results_by_email?: boolean;
  notify_new_coaches?: boolean;
}

export interface MatchingResult {
  coach_id: string;
  match_score: number;
  reasons: string[];
  concern: string | null;
}

export interface ConversationRecord {
  id: string;
  coach_id: string;
  user_id: string;
  status: "active" | "archived" | "blocked";
  last_message?: string | null;
  last_msg_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "user" | "coach" | "admin";
  body: string;
  attachments: Array<Record<string, unknown>>;
  read: boolean;
  created_at: string;
}

export interface FitnessEventRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  event_type: string;
  cover_image_url?: string | null;
  gallery_urls: string[];
  venue_name?: string | null;
  address?: string | null;
  city: string;
  country: string;
  lat?: number | null;
  lng?: number | null;
  is_virtual: boolean;
  virtual_link?: string | null;
  starts_at: string;
  ends_at: string;
  registration_deadline?: string | null;
  capacity?: number | null;
  spots_remaining?: number | null;
  is_free: boolean;
  price_usd?: number | null;
  stripe_price_id?: string | null;
  organiser_id?: string | null;
  difficulty_level?: string | null;
  tags: string[];
  status: "draft" | "published" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
}
