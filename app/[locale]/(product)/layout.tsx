import type { ReactNode } from "react";
import { ChromeShell } from "@/shared/patterns/chrome-shell";
import { BottomNavigation } from "@/shared/patterns/bottom-navigation";
import { countUnreadOpenInboxItems } from "@/modules/inbox/application";

export default async function ProductLayout({
  children,
}: {
  children: ReactNode;
}) {
  const inboxCount = (await countUnreadOpenInboxItems()) ?? 0;

  return (
    <ChromeShell
      chrome="product"
      footer={<BottomNavigation inboxCount={inboxCount} />}
    >
      {children}
    </ChromeShell>
  );
}
