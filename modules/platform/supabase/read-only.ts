/**
 * Read-only Supabase client shield (BR-24 / AC-HLT-01).
 * Blocks insert/update/upsert/delete/rpc on the wrapped client tree.
 */

export const HEALTH_READONLY_VIOLATION = "health_readonly_violation" as const;

export class HealthReadOnlyViolationError extends Error {
  readonly code = HEALTH_READONLY_VIOLATION;
  readonly method: string;

  constructor(method: string) {
    super(
      `Health-RO violation: '${method}' is forbidden on the Health read-only client (BR-24 / AC-HLT-01).`,
    );
    this.name = "HealthReadOnlyViolationError";
    this.method = method;
  }
}

const FORBIDDEN_WRITE_METHODS = [
  "insert",
  "update",
  "upsert",
  "delete",
  "rpc",
] as const;

export const HEALTH_READONLY_FORBIDDEN_METHODS = FORBIDDEN_WRITE_METHODS;

function isForbiddenMethod(prop: string | symbol): prop is string {
  return (
    typeof prop === "string" &&
    (FORBIDDEN_WRITE_METHODS as readonly string[]).includes(prop)
  );
}

/**
 * Deep Proxy that throws on any write-style PostgREST method.
 * Safe to wrap query builders returned from `.from()`.
 */
export function asReadOnlySupabaseClient<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (isForbiddenMethod(prop)) {
        return () => {
          throw new HealthReadOnlyViolationError(prop);
        };
      }

      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return (...args: unknown[]) => {
          const result = (value as (...a: unknown[]) => unknown).apply(
            target,
            args,
          );
          if (result != null && typeof result === "object") {
            return asReadOnlySupabaseClient(result as object);
          }
          return result;
        };
      }

      if (value != null && typeof value === "object") {
        return asReadOnlySupabaseClient(value as object);
      }

      return value;
    },
  }) as T;
}

export function isHealthReadOnlyViolation(error: unknown): boolean {
  return error instanceof HealthReadOnlyViolationError;
}
