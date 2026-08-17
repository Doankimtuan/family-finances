/**
 * Small application Result contract. Success payloads follow the existing
 * flattened `ok` shape used by module commands and server actions.
 */
export type Result<T extends object, E extends string> =
  ({ ok: true } & T) | { ok: false; code: E };
