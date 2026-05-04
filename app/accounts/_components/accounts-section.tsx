import { ArchiveAccountButton } from "@/app/accounts/_components/archive-account-button";
import { CreateAccountDialog } from "@/app/accounts/_components/create-account-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";
import { t as dictT } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { cn } from "@/lib/utils";
import { Landmark, Plus } from "lucide-react";
import Link from "next/link";
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
    <section className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t("money.accounts.title")}
          </h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            {t("money.accounts.total")}:{" "}
            {formatVndCompact(totalAccountBalance, householdLocale)}
          </p>
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
        <div className="grid grid-cols-2 gap-3">
          {standardAccounts.map((account) => {
            const balance = balanceMap.get(account.id) ?? 0;
            const colors = getAccountColors(account.type);
            const Icon = getAccountIcon(account.type);
            return (
              <Card
                key={account.id}
                className={cn(
                  "border transition-all duration-200 hover:shadow-md",
                  colors.border,
                  colors.bg,
                )}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-wider",
                          colors.label,
                        )}
                      >
                        {getAccountTypeLabel(account.type, t)}
                      </p>
                      <p className="text-sm font-bold text-foreground truncate mt-0.5">
                        {account.name}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ml-2",
                        colors.icon,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-xl font-black tracking-tight",
                        colors.value,
                      )}
                    >
                      {formatVndCompact(balance, householdLocale)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatVnd(balance, householdLocale)}
                    </p>
                  </div>
                  <ArchiveAccountButton accountId={account.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
