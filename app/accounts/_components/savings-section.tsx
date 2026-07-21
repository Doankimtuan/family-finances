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
    <section className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-end sm:justify-between sm:p-5 md:p-6">
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-primary/70">
            {t("money.savings.title")}
          </p>
          <div className="flex items-baseline justify-between gap-x-3">
            <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
              {t("money.savings.title")}
            </h2>
            <p className="text-sm font-semibold text-muted-foreground">
              {t("money.savings.total")}: {formatVndCompact(totalSavingsValue, householdLocale)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="ghost" size="sm" className="rounded-full px-4">
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
          iconClassName="h-7 w-7 text-emerald-600"
          iconWrapperClassName="h-14 w-14 bg-emerald-50"
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
            <Card className="border-dashed border-border/70 bg-muted/30">
              <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    +{hiddenSavingsCount} {t("money.savings.more_items")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("money.savings.view_all")}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-full">
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
