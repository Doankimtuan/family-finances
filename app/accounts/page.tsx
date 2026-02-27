import { ArchiveAccountButton } from "@/app/accounts/_components/archive-account-button";
import { CreateAccountForm } from "@/app/accounts/_components/create-account-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { MetricCard } from "@/components/ui/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { Landmark, Building2, ShieldCheck, PlusCircle } from "lucide-react";

export const metadata = {
  title: "Accounts | Family Finances",
};

type AccountRow = {
  id: string;
  name: string;
  type: string;
  opening_balance: number;
};

export default async function AccountsPage() {
  const { householdId, language, householdLocale } =
    await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  const accountsResult = await supabase
    .from("accounts")
    .select("id, name, type, opening_balance")
    .eq("household_id", householdId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  const accounts = (accountsResult.data ?? []) as AccountRow[];

  const txResult = accounts.length
    ? await supabase
        .from("transactions")
        .select("account_id, type, amount")
        .eq("household_id", householdId)
        .in(
          "account_id",
          accounts.map((account) => account.id),
        )
    : { data: [], error: null };

  const balanceMap = new Map<string, number>();
  for (const account of accounts) {
    balanceMap.set(account.id, Number(account.opening_balance));
  }

  for (const row of txResult.data ?? []) {
    const current = balanceMap.get(row.account_id) ?? 0;
    const delta =
      row.type === "income"
        ? Number(row.amount)
        : row.type === "expense"
          ? -Number(row.amount)
          : 0;
    balanceMap.set(row.account_id, current + delta);
  }

  const totalBalance = Array.from(balanceMap.values()).reduce(
    (sum, b) => sum + b,
    0,
  );

  return (
    <AppShell
      header={<AppHeader title={t(language, "accounts.title")} />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricCard
            label={vi ? "Tổng tài sản" : "Total Assets"}
            value={formatVndCompact(totalBalance, householdLocale)}
            icon={Building2}
            variant="default"
          />
          <MetricCard
            label={vi ? "Số lượng tài khoản" : "Total Accounts"}
            value={accounts.length.toString()}
            icon={ShieldCheck}
            variant="success"
          />
        </section>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <SectionHeader
              label="Onboarding"
              title={vi ? "Tạo tài khoản" : "Create Account"}
              description={
                vi
                  ? "Thêm ví, tài khoản ngân hàng hoặc các quỹ tiết kiệm của gia đình."
                  : "Add wallets, bank accounts, or household saving funds."
              }
            />
          </CardHeader>
          <CardContent>
            <CreateAccountForm />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <SectionHeader
            label="Directory"
            title={vi ? "Tài khoản đang hoạt động" : "Active Accounts"}
          />

          {accountsResult.error ? (
            <EmptyState
              icon={Landmark}
              title="Error loading accounts"
              description={accountsResult.error.message}
              className="bg-destructive/5 border-destructive/20"
            />
          ) : accounts.length === 0 ? (
            <EmptyState
              icon={PlusCircle}
              title={vi ? "Chưa có tài khoản" : "No accounts yet"}
              description={
                vi
                  ? "Hãy tạo tài khoản đầu tiên để bắt đầu theo dõi dòng tiền."
                  : "Create your first account to start tracking household cash flow."
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {accounts.map((account) => {
                const balance = balanceMap.get(account.id) ?? 0;
                return (
                  <Card
                    key={account.id}
                    className="group hover:border-primary/30 transition-all duration-300"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                            <Landmark className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold text-foreground">
                              {account.name}
                            </h3>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase font-bold bg-muted/20"
                              >
                                {account.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-primary">
                            {formatVnd(balance, householdLocale)}
                          </p>
                          <ArchiveAccountButton accountId={account.id} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
