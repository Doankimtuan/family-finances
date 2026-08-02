import type { AuthEntryDestination } from "./resolve-auth-entry";
import { APP_PATH } from "./app-path";

export type AuthEntryAppPath =
  typeof APP_PATH.HOME | typeof APP_PATH.ONBOARD | typeof APP_PATH.WELCOME;

/**
 * Map splash / post-auth destination tokens to in-app locale-relative paths.
 */
export function pathForAuthEntry(
  destination: AuthEntryDestination,
): AuthEntryAppPath {
  switch (destination) {
    case "home":
      return APP_PATH.HOME;
    case "onboard":
      return APP_PATH.ONBOARD;
    default:
      return APP_PATH.WELCOME;
  }
}
