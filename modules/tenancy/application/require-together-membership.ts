import { requireProductSession } from "./require-product-session";

export type { ProductSessionGate as TogetherMembershipGate } from "./require-product-session";

/**
 * Shared Together subpage gate. Reuses the canonical product session helper
 * and always preserves `next` so post-sign-in resumes the Together path.
 */
export async function requireTogetherMembership(input: {
  localeParam: string;
  nextPath: string;
}) {
  return requireProductSession(input);
}
