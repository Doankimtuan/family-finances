/**
 * Shared helpers for Server Action responses.
 *
 * Usage:
 *   import { ok, fail } from "@/lib/server/action-helpers";
 *   return ok("Transaction deleted.");
 *   return fail("Insufficient balance.");
 *
 * For domain-specific extra fields, extend ActionState<T>:
 *   type TransactionState = ActionState<{ spendingJarWarning?: ... }>;
 */

/** Base action state type — status + message. */
export type ActionState<TExtra extends object = Record<string, never>> = {
  status: "idle" | "success" | "error";
  message: string;
} & TExtra;

/** Generic initial state for useActionState / useFormState hooks. */
export function initialActionState<
  TExtra extends object = Record<string, never>,
>(extra?: TExtra): ActionState<TExtra> {
  return { status: "idle", message: "", ...(extra ?? ({} as TExtra)) };
}

/** Creates a success response. */
export function ok<TExtra extends object = Record<string, never>>(
  message: string,
  extra?: TExtra,
): ActionState<TExtra> {
  return { status: "success", message, ...(extra ?? ({} as TExtra)) };
}

/** Creates an error response. */
export function fail<TExtra extends object = Record<string, never>>(
  message: string,
  extra?: TExtra,
): ActionState<TExtra> {
  return { status: "error", message, ...(extra ?? ({} as TExtra)) };
}
