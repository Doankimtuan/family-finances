import type { AbstractIntlMessages } from "use-intl";
import type { MessageNamespace } from "./load-messages";

type ClientMessageNamespaces = readonly MessageNamespace[];

const SHARED_CLIENT_NAMESPACES = ["a11y", "buttons", "forms"] as const;

export const CLIENT_MESSAGE_NAMESPACES = {
  AUTH: [
    ...SHARED_CLIENT_NAMESPACES,
    "auth",
    "common",
    "settings",
    "validation",
  ],
  ONBOARD: [
    ...SHARED_CLIENT_NAMESPACES,
    "common",
    "onboard",
    "settings",
    "validation",
  ],
  INVITE: [...SHARED_CLIENT_NAMESPACES, "common", "settings", "together"],
  SYSTEM: [...SHARED_CLIENT_NAMESPACES, "settings", "system"],
  PRODUCT: [...SHARED_CLIENT_NAMESPACES, "navigation"],
  HOME: [...SHARED_CLIENT_NAMESPACES, "home", "system"],
  HEALTH: [...SHARED_CLIENT_NAMESPACES],
  MONEY: [...SHARED_CLIENT_NAMESPACES, "catalog", "common", "money", "system"],
  PLAN: [...SHARED_CLIENT_NAMESPACES, "catalog", "common", "plan", "system"],
  INBOX: [...SHARED_CLIENT_NAMESPACES, "catalog", "inbox", "system"],
  TOGETHER: [
    ...SHARED_CLIENT_NAMESPACES,
    "auth",
    "settings",
    "system",
    "together",
  ],
} as const satisfies Record<string, ClientMessageNamespaces>;

export function selectClientMessages(
  messages: AbstractIntlMessages,
  namespaces: ClientMessageNamespaces,
): AbstractIntlMessages {
  return Object.fromEntries(
    namespaces.map((namespace) => [namespace, messages[namespace]]),
  );
}
