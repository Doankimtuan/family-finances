export type AuditEventInput = {
  householdId: string;
  actorUserId: string;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
};

export async function writeAuditEvent(
  supabase: { from: (table: string) => { insert: (values: Record<string, unknown>) => unknown } },
  input: AuditEventInput,
): Promise<void> {
  const result = (await supabase.from("audit_events").insert({
    household_id: input.householdId,
    actor_user_id: input.actorUserId,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    payload: input.payload ?? {},
  })) as { error: { message: string } | null };
  const { error } = result;

  if (error) {
    console.error("Failed to write audit event", {
      message: error.message,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
    });
  }
}
