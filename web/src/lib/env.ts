const requiredPublicEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function hasPublicEnv() {
  return requiredPublicEnv.every((key) => Boolean(process.env[key]));
}

export function hasSupabaseAdminEnv() {
  return hasPublicEnv() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getPublicEnv() {
  for (const key of requiredPublicEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    mapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  };
}

export function getServerEnv() {
  const publicEnv = getPublicEnv();

  return {
    ...publicEnv,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "Mofitness <notifications@mofitness.app>",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  };
}
