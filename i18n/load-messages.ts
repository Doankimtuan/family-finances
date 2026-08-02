import type { AppLocale } from "./routing";

/**
 * Namespace files under messages/{locale}/ — keep catalogs modular.
 * Add a new locale by copying messages/en → messages/{locale} and translating.
 */
export const MESSAGE_NAMESPACES = [
  "common",
  "navigation",
  "auth",
  "onboard",
  "together",
  "money",
  "plan",
  "inbox",
  "health",
  "settings",
  "validation",
  "errors",
  "buttons",
  "dialogs",
  "forms",
  "emptyStates",
  "toast",
  "metadata",
  "a11y",
  "catalog",
] as const;

export type MessageNamespace = (typeof MESSAGE_NAMESPACES)[number];

function isModuleNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  if (err.code === "MODULE_NOT_FOUND" || err.code === "ERR_MODULE_NOT_FOUND") {
    return true;
  }
  // Turbopack / webpack phrasing
  return (
    typeof err.message === "string" &&
    /Cannot find module|Failed to fetch dynamically imported module|Unknown variable dynamic import/i.test(
      err.message,
    )
  );
}

async function importNamespace(locale: string, ns: MessageNamespace) {
  const mod = await import(`../messages/${locale}/${ns}.json`);
  return mod.default as Record<string, unknown>;
}

export async function loadMessages(locale: string) {
  const messages: Record<string, unknown> = {};

  await Promise.all(
    MESSAGE_NAMESPACES.map(async (ns) => {
      try {
        messages[ns] = await importNamespace(locale, ns);
      } catch (error) {
        if (!isModuleNotFound(error)) {
          throw error;
        }
        // Missing locale file only — fall back to English catalog
        messages[ns] = await importNamespace("en", ns);
      }
    }),
  );

  return messages;
}

/** Sync helper for tests / type generation — English catalog only */
export async function loadEnglishMessages() {
  return loadMessages("en" satisfies AppLocale);
}

/** Exported for unit tests */
export { isModuleNotFound };
