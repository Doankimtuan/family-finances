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
            <Link
              href="/settings"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground shadow-sm transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
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
