"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database";
import { getPublicEnv } from "../env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const env = getPublicEnv();
  browserClient = createBrowserClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
  );
  return browserClient;
}
