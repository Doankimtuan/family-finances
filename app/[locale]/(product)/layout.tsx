import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import {
  CLIENT_MESSAGE_NAMESPACES,
  selectClientMessages,
} from "@/i18n/client-messages";
import { ChromeShell } from "@/shared/patterns/chrome-shell";
import { BottomNavigation } from "@/shared/patterns/bottom-navigation";
import { ProductRouteTransition } from "@/shared/patterns/product-route-transition";
import { countUnreadOpenInboxItems } from "@/modules/inbox/application";
import { requireProductSession } from "@/modules/tenancy/application/require-product-session";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";

async function ProductNavigation() {
  const inboxCount = (await countUnreadOpenInboxItems()) ?? 0;
  return <BottomNavigation inboxCount={inboxCount} />;
}

async function ProductNavigationShell() {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider
      messages={selectClientMessages(
        messages,
        CLIENT_MESSAGE_NAMESPACES.PRODUCT,
      )}
    >
      <Suspense fallback={<BottomNavigation />}>
        <ProductNavigation />
      </Suspense>
    </NextIntlClientProvider>
  );
}

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProductLayout({ children, params }: Props) {
  const { locale } = await params;
  await requireProductSession({ localeParam: locale });

  return (
    <FinancialPrivacyProvider>
      <ChromeShell chrome="product" footer={<ProductNavigationShell />}>
        <ProductRouteTransition>{children}</ProductRouteTransition>
      </ChromeShell>
    </FinancialPrivacyProvider>
  );
}
