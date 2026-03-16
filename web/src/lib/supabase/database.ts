import type { Database as BaseDatabase, Json } from "@shared/types/supabase";

type BasePublicSchema = BaseDatabase["public"];

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type CoachStatus =
  | "draft"
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "suspended"
  | "more_info_required";

type CertificationStatus = "pending" | "verified" | "rejected";
type CoachDocumentType =
  | "government_id_front"
  | "government_id_back"
  | "proof_of_address"
  | "selfie_with_id"
  | "other";
type MatchStatus = "suggested" | "contacted" | "active" | "completed" | "declined";
type MatchSource = "ai" | "manual";
type ConversationStatus = "active" | "archived" | "blocked";
type MessageSenderType = "user" | "coach" | "admin";
type EventStatus = "draft" | "published" | "cancelled" | "completed";
type EventPaymentStatus = "pending" | "paid" | "refunded" | "free";
type NotificationTargetType = "email" | "push";
type NotificationStatus = "pending" | "sent" | "failed";

type UserRoleTable = TableDefinition<
  {
    user_id: string;
    role: "admin" | "coach";
    created_at: string;
  },
  {
    user_id: string;
    role: "admin" | "coach";
    created_at?: string;
  },
  {
    user_id?: string;
    role?: "admin" | "coach";
    created_at?: string;
  }
>;

type CoachTable = TableDefinition<
  {
    id: string;
    user_id: string;
    slug: string;
    full_name: string;
    email: string;
    phone: string | null;
    profile_photo_url: string | null;
    cover_photo_url: string | null;
    bio: string;
    tagline: string | null;
    country: string;
    city: string;
    address: string | null;
    lat: number | null;
    lng: number | null;
    radius_km: number;
    specialisations: string[];
    experience_years: number;
    languages: string[];
    website_url: string | null;
    facebook_url: string | null;
    instagram_url: string | null;
    linkedin_url: string | null;
    youtube_url: string | null;
    session_types: string[];
    price_per_hour_usd: number | null;
    currency: string;
    availability: Json;
    package_summary: string | null;
    status: CoachStatus;
    verification_score: number | null;
    application_submitted_at: string | null;
    verified_at: string | null;
    rejected_at: string | null;
    rejection_reason: string | null;
    admin_notes: string | null;
    total_clients: number;
    avg_rating: number;
    total_reviews: number;
    response_rate_pct: number;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
  },
  {
    id?: string;
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
    radius_km?: number;
    specialisations?: string[];
    experience_years?: number;
    languages?: string[];
    website_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    linkedin_url?: string | null;
    youtube_url?: string | null;
    session_types?: string[];
    price_per_hour_usd?: number | null;
    currency?: string;
    availability?: Json;
    package_summary?: string | null;
    status?: CoachStatus;
    verification_score?: number | null;
    application_submitted_at?: string | null;
    verified_at?: string | null;
    rejected_at?: string | null;
    rejection_reason?: string | null;
    admin_notes?: string | null;
    total_clients?: number;
    avg_rating?: number;
    total_reviews?: number;
    response_rate_pct?: number;
    is_featured?: boolean;
    created_at?: string;
    updated_at?: string;
  },
  {
    id?: string;
    user_id?: string;
    slug?: string;
    full_name?: string;
    email?: string;
    phone?: string | null;
    profile_photo_url?: string | null;
    cover_photo_url?: string | null;
    bio?: string;
    tagline?: string | null;
    country?: string;
    city?: string;
    address?: string | null;
    lat?: number | null;
    lng?: number | null;
    radius_km?: number;
    specialisations?: string[];
    experience_years?: number;
    languages?: string[];
    website_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    linkedin_url?: string | null;
    youtube_url?: string | null;
    session_types?: string[];
    price_per_hour_usd?: number | null;
    currency?: string;
    availability?: Json;
    package_summary?: string | null;
    status?: CoachStatus;
    verification_score?: number | null;
    application_submitted_at?: string | null;
    verified_at?: string | null;
    rejected_at?: string | null;
    rejection_reason?: string | null;
    admin_notes?: string | null;
    total_clients?: number;
    avg_rating?: number;
    total_reviews?: number;
    response_rate_pct?: number;
    is_featured?: boolean;
    created_at?: string;
    updated_at?: string;
  }
>;

type CoachCertificationTable = TableDefinition<
  {
    id: string;
    coach_id: string;
    certification_name: string;
    issuing_organisation: string;
    year_obtained: number | null;
    certificate_number: string | null;
    certificate_file_path: string;
    status: CertificationStatus;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
  },
  {
    id?: string;
    coach_id: string;
    certification_name: string;
    issuing_organisation: string;
    year_obtained?: number | null;
    certificate_number?: string | null;
    certificate_file_path: string;
    status?: CertificationStatus;
    admin_notes?: string | null;
    created_at?: string;
    updated_at?: string;
  },
  {
    id?: string;
    coach_id?: string;
    certification_name?: string;
    issuing_organisation?: string;
    year_obtained?: number | null;
    certificate_number?: string | null;
    certificate_file_path?: string;
    status?: CertificationStatus;
    admin_notes?: string | null;
    created_at?: string;
    updated_at?: string;
  }
>;

type CoachDocumentTable = TableDefinition<
  {
    id: string;
    coach_id: string;
    document_type: CoachDocumentType;
    file_name: string | null;
    file_path: string;
    mime_type: string | null;
    status: CertificationStatus;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
  },
  {
    id?: string;
    coach_id: string;
    document_type: CoachDocumentType;
    file_name?: string | null;
    file_path: string;
    mime_type?: string | null;
    status?: CertificationStatus;
    reviewed_at?: string | null;
    created_at?: string;
    updated_at?: string;
  },
  {
    id?: string;
    coach_id?: string;
    document_type?: CoachDocumentType;
    file_name?: string | null;
    file_path?: string;
    mime_type?: string | null;
    status?: CertificationStatus;
    reviewed_at?: string | null;
    created_at?: string;
    updated_at?: string;
  }
>;

type CoachReviewTable = TableDefinition<
  {
    id: string;
    coach_id: string;
    reviewer_id: string | null;
    rating: number;
    headline: string | null;
    body: string | null;
    is_verified: boolean;
    created_at: string;
    updated_at: string;
  },
  {
    id?: string;
    coach_id: string;
    reviewer_id?: string | null;
    rating: number;
    headline?: string | null;
    body?: string | null;
    is_verified?: boolean;
    created_at?: string;
    updated_at?: string;
  },
  {
    id?: string;
    coach_id?: string;
    reviewer_id?: string | null;
    rating?: number;
    headline?: string | null;
    body?: string | null;
    is_verified?: boolean;
    created_at?: string;
    updated_at?: string;
  }
>;

type WebUserProfileTable = TableDefinition<
  {
    id: string;
    email: string;
    full_name: string | null;
    age: number | null;
    gender: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    bmi: number | null;
    bmi_category: string | null;
    bmr: number | null;
    tdee: number | null;
    ideal_weight_min_kg: number | null;
    ideal_weight_max_kg: number | null;
    daily_calorie_target: number | null;
    fitness_goal: string | null;
    fitness_level: string | null;
    injuries: string[];
    preferred_session: string | null;
    budget_per_session_usd: number | null;
    location_lat: number | null;
    location_lng: number | null;
    city: string | null;
    country: string | null;
    travel_radius_km: number | null;
    send_results_by_email: boolean;
    notify_new_coaches: boolean;
    created_at: string;
    updated_at: string;
  },
  {
    id?: string;
    email: string;
    full_name?: string | null;
    age?: number | null;
    gender?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    bmi?: number | null;
    bmi_category?: string | null;
    bmr?: number | null;
    tdee?: number | null;
    ideal_weight_min_kg?: number | null;
    ideal_weight_max_kg?: number | null;
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
    created_at?: string;
    updated_at?: string;
  },
  {
    id?: string;
    email?: string;
    full_name?: string | null;
    age?: number | null;
    gender?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    bmi?: number | null;
    bmi_category?: string | null;
    bmr?: number | null;
    tdee?: number | null;
    ideal_weight_min_kg?: number | null;
    ideal_weight_max_kg?: number | null;
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
    created_at?: string;
    updated_at?: string;
  }
>;

type CoachMatchTable = TableDefinition<
  {
    id: string;
    user_id: string | null;
    web_profile_id: string | null;
    coach_id: string;
    match_source: MatchSource;
    match_score: number | null;
    match_reasons: Json;
    concern_notes: string | null;
    status: MatchStatus;
    created_at: string;
    updated_at: string;
  },
  {
    id?: string;
    user_id?: string | null;
    web_profile_id?: string | null;
    coach_id: string;
    match_source?: MatchSource;
    match_score?: number | null;
    match_reasons?: Json;
    concern_notes?: string | null;
    status?: MatchStatus;
    created_at?: string;
    updated_at?: string;
  },
  {
    id?: string;
    user_id?: string | null;
    web_profile_id?: string | null;
    coach_id?: string;
    match_source?: MatchSource;
    match_score?: number | null;
    match_reasons?: Json;
    concern_notes?: string | null;
    status?: MatchStatus;
    created_at?: string;
    updated_at?: string;
  }
>;

type ConversationTable = TableDefinition<
  {
    id: string;
    coach_id: string;
    user_id: string;
    status: ConversationStatus;
    last_message: string | null;
    last_msg_at: string | null;
    created_at: string;
    updated_at: string;
  },
  {
    id?: string;
    coach_id: string;
    user_id: string;
    status?: ConversationStatus;
    last_message?: string | null;
    last_msg_at?: string | null;
    created_at?: string;
    updated_at?: string;
  },
  {
    id?: string;
    coach_id?: string;
    user_id?: string;
    status?: ConversationStatus;
    last_message?: string | null;
    last_msg_at?: string | null;
    created_at?: string;
    updated_at?: string;
  }
>;

type MessageTable = TableDefinition<
  {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_type: MessageSenderType;
    body: string;
    attachments: Json;
    read: boolean;
    created_at: string;
  },
  {
    id?: string;
    conversation_id: string;
    sender_id: string;
    sender_type: MessageSenderType;
    body: string;
    attachments?: Json;
    read?: boolean;
    created_at?: string;
  },
  {
    id?: string;
    conversation_id?: string;
    sender_id?: string;
    sender_type?: MessageSenderType;
    body?: string;
    attachments?: Json;
    read?: boolean;
    created_at?: string;
  }
>;

type FitnessEventTable = TableDefinition<
  {
    id: string;
    slug: string;
    title: string;
    description: string;
    event_type: string;
    cover_image_url: string | null;
    gallery_urls: string[];
    venue_name: string | null;
    address: string | null;
    city: string;
    country: string;
    lat: number | null;
    lng: number | null;
    is_virtual: boolean;
    virtual_link: string | null;
    starts_at: string;
    ends_at: string;
    registration_deadline: string | null;
    capacity: number | null;
    spots_remaining: number | null;
    is_free: boolean;
    price_usd: number | null;
    stripe_price_id: string | null;
    organiser_id: string | null;
    difficulty_level: string | null;
    tags: string[];
    status: EventStatus;
    created_at: string;
    updated_at: string;
  },
  {
    id?: string;
    slug: string;
    title: string;
    description: string;
    event_type: string;
    cover_image_url?: string | null;
    gallery_urls?: string[];
    venue_name?: string | null;
    address?: string | null;
    city: string;
    country: string;
    lat?: number | null;
    lng?: number | null;
    is_virtual?: boolean;
    virtual_link?: string | null;
    starts_at: string;
    ends_at: string;
    registration_deadline?: string | null;
    capacity?: number | null;
    spots_remaining?: number | null;
    is_free?: boolean;
    price_usd?: number | null;
    stripe_price_id?: string | null;
    organiser_id?: string | null;
    difficulty_level?: string | null;
    tags?: string[];
    status?: EventStatus;
    created_at?: string;
    updated_at?: string;
  },
  {
    id?: string;
    slug?: string;
    title?: string;
    description?: string;
    event_type?: string;
    cover_image_url?: string | null;
    gallery_urls?: string[];
    venue_name?: string | null;
    address?: string | null;
    city?: string;
    country?: string;
    lat?: number | null;
    lng?: number | null;
    is_virtual?: boolean;
    virtual_link?: string | null;
    starts_at?: string;
    ends_at?: string;
    registration_deadline?: string | null;
    capacity?: number | null;
    spots_remaining?: number | null;
    is_free?: boolean;
    price_usd?: number | null;
    stripe_price_id?: string | null;
    organiser_id?: string | null;
    difficulty_level?: string | null;
    tags?: string[];
    status?: EventStatus;
    created_at?: string;
    updated_at?: string;
  }
>;

type EventRegistrationTable = TableDefinition<
  {
    id: string;
    event_id: string;
    user_id: string | null;
    full_name: string;
    email: string;
    phone: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    medical_conditions: string | null;
    tshirt_size: string | null;
    payment_status: EventPaymentStatus;
    stripe_session: string | null;
    stripe_payment_intent: string | null;
    ticket_code: string;
    checked_in: boolean;
    checked_in_at: string | null;
    registered_at: string;
  },
  {
    id?: string;
    event_id: string;
    user_id?: string | null;
    full_name: string;
    email: string;
    phone?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    medical_conditions?: string | null;
    tshirt_size?: string | null;
    payment_status?: EventPaymentStatus;
    stripe_session?: string | null;
    stripe_payment_intent?: string | null;
    ticket_code: string;
    checked_in?: boolean;
    checked_in_at?: string | null;
    registered_at?: string;
  },
  {
    id?: string;
    event_id?: string;
    user_id?: string | null;
    full_name?: string;
    email?: string;
    phone?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    medical_conditions?: string | null;
    tshirt_size?: string | null;
    payment_status?: EventPaymentStatus;
    stripe_session?: string | null;
    stripe_payment_intent?: string | null;
    ticket_code?: string;
    checked_in?: boolean;
    checked_in_at?: string | null;
    registered_at?: string;
  }
>;

type NotificationLogTable = TableDefinition<
  {
    id: string;
    category: string;
    target_type: NotificationTargetType;
    recipient: string;
    payload: Json;
    status: NotificationStatus;
    error_message: string | null;
    created_at: string;
    processed_at: string | null;
  },
  {
    id?: string;
    category: string;
    target_type: NotificationTargetType;
    recipient: string;
    payload?: Json;
    status?: NotificationStatus;
    error_message?: string | null;
    created_at?: string;
    processed_at?: string | null;
  },
  {
    id?: string;
    category?: string;
    target_type?: NotificationTargetType;
    recipient?: string;
    payload?: Json;
    status?: NotificationStatus;
    error_message?: string | null;
    created_at?: string;
    processed_at?: string | null;
  }
>;

export type Database = Omit<BaseDatabase, "public"> & {
  public: {
    Tables: BasePublicSchema["Tables"] & {
      user_roles: UserRoleTable;
      coaches: CoachTable;
      coach_certifications: CoachCertificationTable;
      coach_documents: CoachDocumentTable;
      coach_reviews: CoachReviewTable;
      web_user_profiles: WebUserProfileTable;
      coach_matches: CoachMatchTable;
      conversations: ConversationTable;
      messages: MessageTable;
      fitness_events: FitnessEventTable;
      event_registrations: EventRegistrationTable;
      notification_logs: NotificationLogTable;
    };
    Views: BasePublicSchema["Views"];
    Functions: BasePublicSchema["Functions"] & {
      has_role: {
        Args: { requested_role: string };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_coach_owner: {
        Args: { target_coach_id: string };
        Returns: boolean;
      };
      is_conversation_participant: {
        Args: { target_conversation_id: string };
        Returns: boolean;
      };
      recalculate_coach_rating: {
        Args: { target_coach_id: string };
        Returns: undefined;
      };
      handle_coach_review_change: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      sync_conversation_last_message: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      sync_event_spots_remaining: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: BasePublicSchema["Enums"];
    CompositeTypes: BasePublicSchema["CompositeTypes"];
  };
};

export type { Json };
