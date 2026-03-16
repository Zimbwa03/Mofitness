import * as SecureStore from "expo-secure-store";
import { Linking } from "react-native";
import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@env";
import type { AchievementBadge, Preferences, RewardCatalogItem, UserBadge, UserProfile } from "../models";
import { API_BASE_URL } from "../config/backend";

const SUPABASE_REQUEST_TIMEOUT_MS = 12000;
const CONNECTIVITY_CHECK_TTL_MS = 30000;
const FALLBACK_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const FALLBACK_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const MISSING_SUPABASE_CONFIG_MESSAGE =
  "Missing Supabase config. Provide SUPABASE_URL and SUPABASE_ANON_KEY via .env, set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS variables, or expose them through API /config/mobile.";

type SupabaseRuntimeConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

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
  private config: SupabaseRuntimeConfig | null = null;
  private initializePromise: Promise<void> | null = null;

  constructor() {
    const localConfig = this.readLocalConfig();
    this.config = localConfig;

    // Only raise missing-config eagerly when no backend URL is configured.
    if (!localConfig && !API_BASE_URL) {
      this.missingConfigError = new Error(MISSING_SUPABASE_CONFIG_MESSAGE);
      console.error(this.missingConfigError.message);
    }

    // Keep app startup alive even when env vars are missing.
    // Network calls fail with a clear error via ensureConfigured().
    this.client = this.createClient(
      localConfig?.supabaseUrl ?? "https://invalid.supabase.local",
      localConfig?.supabaseAnonKey ?? "missing-supabase-anon-key",
    );
  }

  private readLocalConfig(): SupabaseRuntimeConfig | null {
    const supabaseUrl = SUPABASE_URL ?? FALLBACK_SUPABASE_URL;
    const supabaseAnonKey = SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    return { supabaseUrl, supabaseAnonKey };
  }

  private createClient(supabaseUrl: string, supabaseAnonKey: string) {
    return createClient(supabaseUrl, supabaseAnonKey, {
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

  private async fetchRemoteConfig() {
    if (!API_BASE_URL) {
      return null;
    }

    const response = await this.fetchWithTimeout(`${API_BASE_URL}/config/mobile`, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Backend config request failed (HTTP ${response.status}).`);
    }

    const payload = (await response.json()) as Partial<SupabaseRuntimeConfig>;
    if (!payload.supabaseUrl || !payload.supabaseAnonKey) {
      throw new Error("Backend /config/mobile response is missing Supabase fields.");
    }

    return {
      supabaseUrl: payload.supabaseUrl,
      supabaseAnonKey: payload.supabaseAnonKey,
    } satisfies SupabaseRuntimeConfig;
  }

  async initialize() {
    if (this.config) {
      return;
    }

    if (!this.initializePromise) {
      this.initializePromise = (async () => {
        try {
          const remoteConfig = await this.fetchRemoteConfig();
          if (!remoteConfig) {
            return;
          }

          this.config = remoteConfig;
          this.client = this.createClient(remoteConfig.supabaseUrl, remoteConfig.supabaseAnonKey);
          this.missingConfigError = null;
        } catch (error) {
          const mapped = this.mapNetworkError(error);
          this.missingConfigError =
            mapped instanceof Error ? mapped : new Error(MISSING_SUPABASE_CONFIG_MESSAGE);
        }
      })();
    }

    await this.initializePromise;
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
    this.ensureConfigured();
    if (Date.now() - this.lastConnectivityCheckAt < CONNECTIVITY_CHECK_TTL_MS) {
      return;
    }

    try {
      const response = await this.fetchWithTimeout(`${this.config!.supabaseUrl}/auth/v1/settings`, {
        headers: {
          apikey: this.config!.supabaseAnonKey,
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
    await this.initialize();
    this.ensureConfigured();
    await this.ensureConnectivity();
    try {
      return await this.client.auth.signInWithPassword({ email, password });
    } catch (error) {
      throw this.mapNetworkError(error);
    }
  }

  async signUp(email: string, password: string, fullName: string) {
    await this.initialize();
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
    await this.initialize();
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
    await this.initialize();
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
    await this.initialize();
    this.ensureConfigured();
    try {
      return await this.client.auth.signOut();
    } catch (error) {
      throw this.mapNetworkError(error);
    }
  }

  async requestPasswordReset(email: string) {
    await this.initialize();
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
    await this.initialize();
    this.ensureConfigured();
    return this.client.auth.getSession();
  }

  async invokeFunction<TResponse>(name: string, body?: unknown) {
    await this.initialize();
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
      const endpoint = `${API_BASE_URL}/api/functions/${name}`;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      };

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
    await this.initialize();
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
    await this.initialize();
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
    await this.initialize();
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
    await this.initialize();
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
    await this.initialize();
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
    await this.initialize();
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
    await this.initialize();
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
    await this.initialize();
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
    await this.initialize();
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
