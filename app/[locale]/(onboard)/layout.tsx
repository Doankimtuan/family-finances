import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import {
  CLIENT_MESSAGE_NAMESPACES,
  selectClientMessages,
} from "@/i18n/client-messages";
import { ChromeShell } from "@/shared/patterns/chrome-shell";

/**
 * Onboarding chrome — no BottomNav (nav group: onboarding).
 */
export default async function OnboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider
      messages={selectClientMessages(
        messages,
        CLIENT_MESSAGE_NAMESPACES.ONBOARD,
      )}
    >
      <ChromeShell chrome="auth">{children}</ChromeShell>
    </NextIntlClientProvider>
  );
}
