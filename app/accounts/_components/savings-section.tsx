import { AddSavingsForm } from "@/app/accounts/savings/_components/add-savings-form";
import { SavingsCard } from "@/app/accounts/savings/_components/savings-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatVndCompact } from "@/lib/dashboard/format";
import { t as dictT } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { HandCoins } from "lucide-react";
import Link from "next/link";
import type { SavingsListItem } from "@/lib/savings/types";


interface SavingsSectionProps {
  featuredSavings: SavingsListItem[];
  hiddenSavingsCount: number;
  activeSavingsCount: number;
  totalSavingsValue: number;
  accounts: { id: string; name: string }[];
  savingsGoalOptions: { id: string; name: string }[];
}

export async function SavingsSection({
  featuredSavings,
  hiddenSavingsCount,
  activeSavingsCount,
  totalSavingsValue,
  accounts,
  savingsGoalOptions,
}: SavingsSectionProps) {
  const { language, householdLocale } = await getAuthenticatedHouseholdContext();
  const t = (key: string) => dictT(language, key);

  return (
    <section className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t("money.savings.title")}
          </h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">
            {t("money.savings.total")}:{" "}
            {formatVndCompact(totalSavingsValue, householdLocale)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="rounded-xl px-3">
            <Link href="/accounts/savings">{t("money.savings.view_all")}</Link>
          </Button>
          <AddSavingsForm
            accounts={accounts}
            goals={savingsGoalOptions}
            triggerLabel={t("money.savings.empty.action")}
          />
        </div>
      </div>

      {activeSavingsCount === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={t("money.savings.empty.title")}
          description={t("money.savings.empty.description")}
          action={
            <AddSavingsForm
              accounts={accounts}
              goals={savingsGoalOptions}
              triggerLabel={t("money.savings.empty.action")}
            />
          }
        />
      ) : (
        <div className="space-y-3">
          {featuredSavings.map((item) => (
            <SavingsCard
              key={item.id}
              item={item}
              locale={householdLocale}
              href={`/accounts/savings/${item.id}`}
            />
          ))}
          {hiddenSavingsCount > 0 && (
            <Card className="border-dashed border-border/70 bg-slate-50/70">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    +{hiddenSavingsCount} {t("money.savings.more_items")}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t("money.savings.view_all")}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link href="/accounts/savings">{t("money.savings.view_all")}</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
