export type RuntimeEnv = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  geminiApiKey: string;
  geminiModel: string;
  aiWorkerSecret: string;
};

let cachedEnv: RuntimeEnv | null = null;

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEnv(): RuntimeEnv {
  if (cachedEnv) return cachedEnv;

  cachedEnv = {
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    geminiApiKey: requireEnv("GEMINI_API_KEY"),
    geminiModel: Deno.env.get("GEMINI_MODEL")?.trim() || "gemini-2.5-flash",
    aiWorkerSecret: requireEnv("AI_WORKER_SECRET"),
  };

  return cachedEnv;
}
