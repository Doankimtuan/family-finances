import type { AuthEntryAppPath } from "./auth-entry-path";
import { pathForAuthEntry } from "./auth-entry-path";
import { APP_PATH } from "./app-path";
import { resolveAuthEntry } from "./resolve-auth-entry";

/** Return the canonical authenticated entry path, or null for public users. */
export async function resolveAuthenticatedEntryPath(): Promise<AuthEntryAppPath | null> {
  const destination = await resolveAuthEntry();
  const destinationPath = pathForAuthEntry(destination);
  return destinationPath === APP_PATH.WELCOME ? null : destinationPath;
}
