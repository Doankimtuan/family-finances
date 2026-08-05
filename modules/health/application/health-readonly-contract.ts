/**
 * Health bounded-context contract (BR-24 / AC-HLT-01).
 * Health is compute-on-read only — no commands, no Supabase client, no writes.
 */

export const HEALTH_BC_CONTRACT = {
  /** Health must never open a direct Supabase client. */
  ALLOWS_DIRECT_SUPABASE: false,
  /** Health must never expose application commands. */
  ALLOWS_COMMANDS: false,
  /** Health must never persist scores or snapshots. */
  ALLOWS_PERSISTENCE: false,
} as const;
