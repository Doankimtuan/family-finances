import { ArchiveAccountButton } from "@/app/accounts/_components/archive-account-button";
import { CreateAccountDialog } from "@/app/accounts/_components/create-account-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";
import { t as dictT } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { cn } from "@/lib/utils";
import { Landmark } from "lucide-react";
import {
  getAccountColors,
  getAccountIcon,
  getAccountTypeLabel,
} from "../_lib/helpers";
import type { AccountRow } from "../_lib/types";

interface AccountsSectionProps {
  standardAccounts: AccountRow[];
  balanceMap: Map<string, number>;
  totalAccountBalance: number;
}

export async function AccountsSection({
  standardAccounts,
  balanceMap,
  totalAccountBalance,
}: AccountsSectionProps) {
  const { language, householdLocale } = await getAuthenticatedHouseholdContext();
  const t = (key: string) => dictT(language, key);

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between sm:p-5 md:p-6">
        <div className="flex-1 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
            {t("money.accounts.title")}
          </p>
          <div className="flex items-baseline justify-between gap-x-3">
            <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
              {t("money.accounts.title")}
            </h2>
            <p className="text-sm font-semibold text-muted-foreground">
              {t("money.accounts.total")}: {formatVndCompact(totalAccountBalance, householdLocale)}
            </p>
          </div>
        </div>
        <CreateAccountDialog />
      </div>

      {standardAccounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title={t("money.accounts.empty.title")}
          description={t("money.accounts.empty.description")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {standardAccounts.map((account) => {
            const balance = balanceMap.get(account.id) ?? 0;
            const colors = getAccountColors(account.type);
            const Icon = getAccountIcon(account.type);
            return (
              <Card
                key={account.id}
                className={cn(
                  "group overflow-hidden border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                  colors.border,
                  colors.bg,
                )}
              >
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className={cn("h-1 w-14 rounded-full", colors.icon)} />

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-[0.18em]",
                          colors.label,
                        )}
                      >
                        {getAccountTypeLabel(account.type, t)}
                      </p>
                      <p className="mt-1 truncate text-base font-semibold tracking-tight text-foreground">
                        {account.name}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                        colors.icon,
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p
                      className={cn(
                        "text-2xl font-black tracking-tight tabular-nums",
                        colors.value,
                      )}
                    >
                      {formatVndCompact(balance, householdLocale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatVnd(balance, householdLocale)}
                    </p>
                  </div>
                  <div className="pt-1">
                    <ArchiveAccountButton accountId={account.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
