import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";

import type { ActivityLevel, AuthState, ExperienceLevel, Preferences, UserProfile } from "../models";
import supabaseService from "../services/SupabaseService";

const defaultPreferences: Preferences = {
  training_days_per_week: null,
  available_equipment: [],
  preferred_workout_time: null,
  dietary_restrictions: [],
  country_code: null,
  allergies: [],
  cuisine_preferences: [],
  medical_conditions: "",
  activity_type: null,
  sport_focus: "",
  interest_in_mindfulness: false,
  wants_challenges: true,
  has_wearable: false,
};

const buildDraftProfile = (session: Session): UserProfile => ({
  id: session.user.id,
  full_name: String(session.user.user_metadata.full_name ?? ""),
  email: session.user.email ?? "",
  gender: null,
  date_of_birth: null,
  height_cm: null,
  weight_kg: null,
  body_fat_pct: null,
  experience_level: "beginner",
  goals: [],
  activity_level: null,
  points: 0,
  push_token: null,
  notifications_enabled: true,
  onboarding_completed: false,
});

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  preferences: defaultPreferences,
  loading: true,
  isOnboardingComplete: false,

  hydrateSession: async () => {
    set({ loading: true });

    try {
      const {
        data: { session },
      } = await supabaseService.getSession();

      // Avoid clobbering a freshly authenticated session with a stale null
      // from the initial hydration request.
      if (!session && get().session) {
        return;
      }

      await get().syncSession(session);
    } finally {
      set({ loading: false });
    }
  },

  syncSession: async (session) => {
    if (!session) {
      set({
        session: null,
        user: null,
        profile: null,
        preferences: defaultPreferences,
        isOnboardingComplete: false,
        loading: false,
      });
      return;
    }

    const profile = await supabaseService.fetchProfile(session.user.id).catch(() => null);
    const preferences = await supabaseService.fetchPreferences(session.user.id).catch(() => null);

    // Keep onboarding status tied to profile only; preferences/network issues
    // must not force users back into onboarding.
    const nextProfile = profile ?? get().profile ?? buildDraftProfile(session);
    set({
      session,
      user: session.user,
      profile: nextProfile,
      preferences: preferences ?? get().preferences ?? defaultPreferences,
      isOnboardingComplete: Boolean(nextProfile.onboarding_completed),
      loading: false,
    });
  },

  login: async (email, password) => {
    const { data, error } = await supabaseService.signIn(email, password);
    if (error) {
      throw error;
    }
    await get().syncSession(data.session);
  },

  loginWithProvider: async (provider) => {
    await supabaseService.signInWithProvider(provider);
  },

  register: async (fullName, email, password) => {
    const { data, error } = await supabaseService.signUp(email, password, fullName);
    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error("Sign-up succeeded, but no session was returned. Check Supabase email confirmation settings.");
    }

    set({
      session: data.session,
      user: data.session.user,
      profile: {
        id: data.session.user.id,
        full_name: fullName,
        email,
        gender: null,
        date_of_birth: null,
        height_cm: null,
        weight_kg: null,
        body_fat_pct: null,
        experience_level: "beginner" as ExperienceLevel,
        goals: [],
        activity_level: null as ActivityLevel | null,
        points: 0,
        push_token: null,
        notifications_enabled: true,
        onboarding_completed: false,
      },
      preferences: defaultPreferences,
      isOnboardingComplete: false,
    });
  },

  logout: async () => {
    const { error } = await supabaseService.signOut();
    if (error) {
      throw error;
    }
    set({
      session: null,
      user: null,
      profile: null,
      preferences: defaultPreferences,
      isOnboardingComplete: false,
    });
  },

  setProfile: (profile) => {
    const state = get();
    const nextProfile = state.profile ? { ...state.profile, ...profile } : null;
    set({ profile: nextProfile });
  },

  setPreferences: (preferences) => {
    const state = get();
    const nextPreferences = {
      ...state.preferences,
      ...preferences,
    };

    set({ preferences: nextPreferences });
  },

  completeOnboarding: async () => {
    const state = get();

    if (!state.user || !state.profile) {
      throw new Error("Cannot complete onboarding without an authenticated user.");
    }

    const persistedProfile = await supabaseService.upsertProfile({
      ...state.profile,
      id: state.user.id,
      onboarding_completed: true,
    });
    const persistedPreferences = await supabaseService.upsertPreferences(state.user.id, state.preferences);

    set({
      profile: persistedProfile,
      preferences: persistedPreferences,
      isOnboardingComplete: true,
    });
  },

  setOnboardingComplete: (value) => {
    const state = get();
    const nextProfile = state.profile ? { ...state.profile, onboarding_completed: value } : null;

    set({
      isOnboardingComplete: value,
      profile: nextProfile,
    });
  },
}));
