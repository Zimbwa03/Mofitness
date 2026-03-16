import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface FunctionContext {
  admin: SupabaseClient;
  userClient: SupabaseClient;
  userId: string;
}

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function createFunctionContext(req: Request): Promise<FunctionContext> {
  const url = getEnv('SUPABASE_URL');
  const anonKey = Deno.env.get('SB_PUBLISHABLE_KEY') ?? getEnv('SUPABASE_ANON_KEY');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = req.headers.get('Authorization');

  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const userClient = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const admin = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    throw new Error('Invalid user session');
  }

  return {
    admin,
    userClient,
    userId: user.id,
  };
}
