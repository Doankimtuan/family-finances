/**
 * Locale-relative in-app paths for next-intl Link / redirect / router.
 */

export const APP_PATH = {
  HOME: "/home",
  WELCOME: "/welcome",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  MONEY: "/money",
  PLAN: "/plan",
  INBOX: "/inbox",
  TOGETHER: "/together",
  ONBOARD: "/together/onboard",
  INVITATIONS: "/together/invitations",
  POLICIES: "/together/policies",
  PREFERENCES: "/together/preferences",
} as const;

export type AppPath = (typeof APP_PATH)[keyof typeof APP_PATH];

export const INVITE_PATH_SEGMENT = "invite";

/** Locale-relative invite deep link. */
export function invitePath(token: string): string {
  return `/${INVITE_PATH_SEGMENT}/${token}`;
}
