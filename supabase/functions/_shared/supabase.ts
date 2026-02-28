import { createClient } from "npm:@supabase/supabase-js@2";

import { getEnv } from "./env.ts";

export function createServiceClient() {
  const env = getEnv();
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
