import * as SecureStore from "expo-secure-store";
import { Linking } from "react-native";
import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@env";
import type { AchievementBadge, Preferences, RewardCatalogItem, UserBadge, UserProfile } from "../models";

const SUPABASE_REQUEST_TIMEOUT_MS = 12000;
const CONNECTIVITY_CHECK_TTL_MS = 30000;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
const FALLBACK_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const FALLBACK_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const resolvedSupabaseUrl = SUPABASE_URL ?? FALLBACK_SUPABASE_URL;
const resolvedSupabaseAnonKey = SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY;
const MISSING_SUPABASE_CONFIG_MESSAGE =
  "Missing Supabase config. Provide SUPABASE_URL and SUPABASE_ANON_KEY via .env or set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS environment variables.";

const storageAdapter = {
  getItem: async (key: string) => SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: async (key: string) => SecureStore.deleteItemAsync(key),
};

class SupabaseService {
  private client: SupabaseClient;
  private lastConnectivityCheckAt = 0;
  private missingConfigError: Error | null = null;

  constructor() {
    const hasConfig = Boolean(resolvedSupabaseUrl && resolvedSupabaseAnonKey);
    if (!hasConfig) {
      this.missingConfigError = new Error(MISSING_SUPABASE_CONFIG_MESSAGE);
      console.error(this.missingConfigError.message);
    }

    // Keep app startup alive even when env vars are missing.
    // Network calls will fail with a clear error via ensureConfigured().
    this.client = createClient(
      resolvedSupabaseUrl ?? "https://invalid.supabase.local",
      resolvedSupabaseAnonKey ?? "missing-supabase-anon-key",
      {
      auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        fetch: this.fetchWithTimeout,
      },
    });
  }

  private ensureConfigured() {
    if (this.missingConfigError) {
      throw this.missingConfigError;
    }
  }

  private fetchWithTimeout: typeof fetch = async (input, init) => {
    if (init?.signal) {
      return fetch(input, init);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT_MS);

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } catch (error) {
      throw this.mapNetworkError(error);
    } finally {
      clearTimeout(timeout);
    }
  };

  private mapNetworkError(error: unknown) {
    if (!(error instanceof Error)) {
      return error;
    }

    if (error.name === "AbortError") {
      return new Error("Connection timed out. Please check your internet and try again.");
    }

    const lower = error.message.toLowerCase();
    if (lower.includes("network request failed") || lower.includes("failed to fetch")) {
      return new Error("Unable to reach Mofitness servers. Check your internet connection and try again.");
    }

    return error;
  }

  private async ensureConnectivity() {
    if (Date.now() - this.lastConnectivityCheckAt < CONNECTIVITY_CHECK_TTL_MS) {
      return;
    }

    try {
      const response = await this.fetchWithTimeout(`${resolvedSupabaseUrl}/auth/v1/settings`, {
        headers: {
          apikey: resolvedSupabaseAnonKey!,
        },
      });

      if (!response.ok) {
        throw new Error(`Supabase is unavailable right now (HTTP ${response.status}).`);
      }

      this.lastConnectivityCheckAt = Date.now();
    } catch (error) {
      throw this.mapNetworkError(error);
    }
  }

  getClient() {
    return this.client;
  }

  async signIn(email: string, password: string) {
    this.ensureConfigured();
    await this.ensureConnectivity();
    try {
      return await this.client.auth.signInWithPassword({ email, password });
    } catch (error) {
      throw this.mapNetworkError(error);
    }
  }

  async signUp(email: string, password: string, fullName: string) {
    this.ensureConfigured();
    await this.ensureConnectivity();
    try {
      return await this.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
    } catch (error) {
      throw this.mapNetworkError(error);
    }
  }

  async signInWithProvider(provider: "google" | "apple") {
    this.ensureConfigured();
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: "mofitness://auth/callback",
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw error;
    }

    if (!data.url) {
      throw new Error(`Unable to start ${provider} sign-in.`);
    }

    await Linking.openURL(data.url);
  }

  async handleAuthCallback(url: string) {
    this.ensureConfigured();
    const parsedUrl = new URL(url);
    const code = parsedUrl.searchParams.get("code");

    if (!code) {
      return null;
    }

    const { data, error } = await this.client.auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    return data.session;
  }

  async signOut() {
    this.ensureConfigured();
    try {
      return await this.client.auth.signOut();
    } catch (error) {
      throw this.mapNetworkError(error);
    }
  }

  async requestPasswordReset(email: string) {
    this.ensureConfigured();
    await this.ensureConnectivity();
    try {
      return await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: "mofitness://auth/reset-password",
      });
    } catch (error) {
      throw this.mapNetworkError(error);
    }
  }

  async getSession() {
    return this.client.auth.getSession();
  }

  async invokeFunction<TResponse>(name: string, body?: unknown) {
    this.ensureConfigured();
    const {
      data: { session },
      error: sessionError,
    } = await this.client.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session?.access_token) {
      throw new Error("You must be signed in to use this feature.");
    }

    try {
      const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/functions/${name}` : `${resolvedSupabaseUrl}/functions/v1/${name}`;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (!API_BASE_URL) {
        headers.apikey = resolvedSupabaseAnonKey!;
      }

      const response = await this.fetchWithTimeout(endpoint, {
        method: "POST",
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      const contentType = response.headers.get("Content-Type") ?? "";
      const isJson = contentType.includes("application/json");
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const message =
          typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : `Edge Function ${name} failed with HTTP ${response.status}.`;
        throw new Error(message);
      }

      return payload as TResponse;
    } catch (error) {
      const mapped = this.mapNetworkError(error);
      if (mapped instanceof Error) {
        throw new Error(`Function ${name} failed: ${mapped.message}`);
      }

      throw mapped;
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const {
      data: { subscription },
    } = this.client.auth.onAuthStateChange(callback);

    return subscription;
  }

  async fetchProfile(userId: string) {
    this.ensureConfigured();
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle<UserProfile>();

    if (error) {
      throw error;
    }

    return data;
  }

  async fetchPreferences(userId: string) {
    this.ensureConfigured();
    const { data, error } = await this.client
      .from("preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle<Preferences>();

    if (error) {
      throw error;
    }

    return data;
  }

  async upsertProfile(profile: UserProfile) {
    this.ensureConfigured();
    const payload = profile;

    const { data, error } = await this.client
      .from("users")
      .upsert(payload)
      .select()
      .single<UserProfile>();

    if (error) {
      throw error;
    }

    return data;
  }

  async upsertPreferences(userId: string, preferences: Preferences) {
    this.ensureConfigured();
    const payload: Preferences = {
      ...preferences,
      user_id: userId,
    };

    const { data, error } = await this.client
      .from("preferences")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single<Preferences>();

    if (error) {
      throw error;
    }

    return data;
  }

  async updatePushToken(userId: string, pushToken: string | null) {
    this.ensureConfigured();
    const { data, error } = await this.client
      .from("users")
      .update({ push_token: pushToken })
      .eq("id", userId)
      .select()
      .single<UserProfile>();

    if (error) {
      throw error;
    }

    return data;
  }

  async updateNotificationSettings(userId: string, notificationsEnabled: boolean) {
    this.ensureConfigured();
    const { data, error } = await this.client
      .from("users")
      .update({ notifications_enabled: notificationsEnabled })
      .eq("id", userId)
      .select()
      .single<UserProfile>();

    if (error) {
      throw error;
    }

    return data;
  }

  async fetchRewardCatalog() {
    this.ensureConfigured();
    const { data, error } = await this.client
      .from("reward_catalog")
      .select("*")
      .eq("active", true)
      .order("points_cost", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as RewardCatalogItem[];
  }

  async fetchAchievementBadges() {
    this.ensureConfigured();
    const { data, error } = await this.client
      .from("achievement_badges")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as AchievementBadge[];
  }

  async fetchUserBadges(userId: string) {
    this.ensureConfigured();
    const { data, error } = await this.client
      .from("user_badges")
      .select("*")
      .eq("user_id", userId)
      .order("awarded_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []) as UserBadge[];
  }
}

const supabaseService = new SupabaseService();

export default supabaseService;
