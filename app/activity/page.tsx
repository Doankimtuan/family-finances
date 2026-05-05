import Link from "next/link";
import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { Settings } from "lucide-react";
import { TransactionsContent } from "./_components/transactions-content";

export const metadata: Metadata = {
  title: "Activity",
};

export default async function ActivityPage() {
  const { householdId, language } = await getAuthenticatedHouseholdContext();

  return (
    <AppShell
      header={
        <AppHeader
          title={t(language, "transactions.title")}
          rightAction={
            <Link href="/settings" className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
              <Settings className="h-6 w-6" />
              <span className="sr-only">{t(language, "nav.settings")}</span>
            </Link>
          }
        />
      }
      footer={<BottomTabBar />}
    >
      <TransactionsContent householdId={householdId} />
    </AppShell>
  );
}
