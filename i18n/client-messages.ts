import type { AbstractIntlMessages } from "use-intl";
import type { MessageNamespace } from "./load-messages";

type ClientMessageNamespaces = readonly MessageNamespace[];

export const CLIENT_MESSAGE_NAMESPACES = {
  AUTH: ["a11y", "auth", "common", "settings", "validation"],
  ONBOARD: ["a11y", "common", "onboard", "settings", "validation"],
  INVITE: ["a11y", "common", "settings", "together"],
  SYSTEM: ["a11y", "settings", "system"],
  PRODUCT: ["a11y", "navigation"],
  HOME: ["a11y", "home", "system"],
  HEALTH: ["a11y"],
  MONEY: ["a11y", "catalog", "money", "system"],
  PLAN: ["a11y", "catalog", "plan", "system"],
  INBOX: ["a11y", "catalog", "inbox", "system"],
  TOGETHER: ["a11y", "auth", "settings", "system", "together"],
} as const satisfies Record<string, ClientMessageNamespaces>;

export function selectClientMessages(
  messages: AbstractIntlMessages,
  namespaces: ClientMessageNamespaces,
): AbstractIntlMessages {
  return Object.fromEntries(
    namespaces.map((namespace) => [namespace, messages[namespace]]),
  );
}
