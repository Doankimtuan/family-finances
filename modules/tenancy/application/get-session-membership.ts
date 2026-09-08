import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { getSessionUser } from "./get-session-user";
import { getVerifiedAuthSubject } from "./get-verified-auth-subject";
import {
  resolveActiveMembership,
  type ActiveMembership,
} from "./resolve-active-membership";

export type SessionMembership = {
  user: User | null;
  membership: ActiveMembership | null;
};

function rejectedSession(): SessionMembership {
  return { user: null, membership: null };
}

/**
 * Authenticated household context for one server render.
 * Starts membership from the verified JWT subject so it overlaps `getUser()`.
 * The session is valid only when claims, current user, and identity agree.
 */
async function loadSessionMembership(): Promise<SessionMembership> {
  const userPromise = getSessionUser();
  const subject = await getVerifiedAuthSubject();

  if (!subject) {
    await userPromise;
    return rejectedSession();
  }

  const [user, membership] = await Promise.all([
    userPromise,
    resolveActiveMembership(subject),
  ]);

  if (!user || user.id !== subject) {
    return rejectedSession();
  }

  if (membership && membership.userId !== user.id) {
    return rejectedSession();
  }

  return { user, membership };
}

export const getSessionMembership = cache(loadSessionMembership);
