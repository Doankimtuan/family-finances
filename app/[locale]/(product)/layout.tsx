import type { ReactNode } from "react";
import { ChromeShell } from "@/shared/patterns/chrome-shell";
import { BottomNavigation } from "@/shared/patterns/bottom-navigation";
import { listOpenInboxItems } from "@/modules/inbox/application";

export default async function ProductLayout({
  children,
}: {
  children: ReactNode;
}) {
  const inbox = await listOpenInboxItems();
  const inboxCount = inbox?.length ?? 0;

  return (
    <ChromeShell
      chrome="product"
      footer={<BottomNavigation inboxCount={inboxCount} />}
    >
      {children}
    </ChromeShell>
  );
}
