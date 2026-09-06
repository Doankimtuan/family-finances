import { Suspense } from "react";
import type { ReactNode } from "react";
import { ChromeShell } from "@/shared/patterns/chrome-shell";
import { BottomNavigation } from "@/shared/patterns/bottom-navigation";
import { countUnreadOpenInboxItems } from "@/modules/inbox/application";

async function ProductNavigation() {
  const inboxCount = (await countUnreadOpenInboxItems()) ?? 0;
  return <BottomNavigation inboxCount={inboxCount} />;
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <ChromeShell
      chrome="product"
      footer={
        <Suspense fallback={<BottomNavigation />}>
          <ProductNavigation />
        </Suspense>
      }
    >
      {children}
    </ChromeShell>
  );
}
