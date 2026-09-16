import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import {
  CLIENT_MESSAGE_NAMESPACES,
  selectClientMessages,
} from "@/i18n/client-messages";

export default async function HealthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider
      messages={selectClientMessages(
        messages,
        CLIENT_MESSAGE_NAMESPACES.HEALTH,
      )}
    >
      {children}
    </NextIntlClientProvider>
  );
}
