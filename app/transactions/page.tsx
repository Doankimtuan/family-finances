import { Suspense } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { Settings } from "lucide-react";
import { TransactionsContent } from "./_components/transactions-content";
import { TransactionsSkeleton } from "./_components/transactions-skeleton";

export const metadata = {
  title: "Transactions | Family Finances",
};

export default async function TransactionsPage() {
  const { householdId, language } = await getAuthenticatedHouseholdContext();
  const vi = language === "vi";

  return (
    <AppShell
      header={
        <AppHeader
          title={t(language, "transactions.title")}
          rightAction={
            <Link
              href="/settings"
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="h-6 w-6" />
              <span className="sr-only">Settings</span>
            </Link>
          }
        />
      }
      footer={<BottomTabBar />}
    >
      <Suspense fallback={<TransactionsSkeleton />}>
        <TransactionsContent householdId={householdId} vi={vi} />
      </Suspense>
    </AppShell>
  );
}
