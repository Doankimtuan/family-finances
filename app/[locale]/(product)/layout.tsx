import { Suspense } from "react";
import type { ReactNode } from "react";
import { ChromeShell } from "@/shared/patterns/chrome-shell";
import { BottomNavigation } from "@/shared/patterns/bottom-navigation";
import { ProductRouteTransition } from "@/shared/patterns/product-route-transition";
import { countUnreadOpenInboxItems } from "@/modules/inbox/application";
import { requireProductSession } from "@/modules/tenancy/application/require-product-session";

async function ProductNavigation() {
  const inboxCount = (await countUnreadOpenInboxItems()) ?? 0;
  return <BottomNavigation inboxCount={inboxCount} />;
}

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProductLayout({ children, params }: Props) {
  const { locale } = await params;
  await requireProductSession({ localeParam: locale });

  return (
    <ChromeShell
      chrome="product"
      footer={
        <Suspense fallback={<BottomNavigation />}>
          <ProductNavigation />
        </Suspense>
      }
    >
      <ProductRouteTransition>{children}</ProductRouteTransition>
    </ChromeShell>
  );
}
