import { SupabaseClient } from "@supabase/supabase-js";
import { CreateEventCommand, EventResult } from "./types";

export async function createJarEvent(
  supabase: SupabaseClient,
  command: CreateEventCommand,
): Promise<EventResult> {
  const result = await supabase
    .from("jar_events")
    .upsert(
      {
        household_id: command.householdId,
        jar_id: command.jarId,
        event_type: command.eventType,
        source_type: command.sourceType,
        source_id: command.sourceId,
        idempotency_key: command.idempotencyKey,
        actor_user_id: command.actorUserId ?? null,
        payload: command.payload ?? {},
      },
      { onConflict: "household_id,idempotency_key" },
    )
    .select("id")
    .single();

  if (result.error || !result.data?.id) {
    throw new Error(result.error?.message ?? "Failed to create jar event.");
  }

  return { id: result.data.id, idempotencyKey: command.idempotencyKey };
}

export async function createJarEvents(
  supabase: SupabaseClient,
  commands: CreateEventCommand[],
): Promise<EventResult[]> {
  return Promise.all(commands.map((cmd) => createJarEvent(supabase, cmd)));
}
