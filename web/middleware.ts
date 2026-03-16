import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "./src/lib/supabase/database";
import { getPublicEnv } from "./src/lib/env";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const env = getPublicEnv();
  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
