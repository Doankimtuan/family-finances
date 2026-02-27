import Link from "next/link";
import { DetailedTransactionForm } from "@/app/transactions/_components/detailed-transaction-form";
import { QuickAddForm } from "@/app/transactions/_components/quick-add-form";
import { TransactionsList } from "@/app/transactions/_components/transactions-list";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n/dictionary";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { History, Landmark, Receipt, Settings } from "lucide-react";

export const metadata = {
  title: "Transactions | Family Finances",
};

export default async function TransactionsPage() {
  const { householdId, language } = await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const supabase = await createClient();

  const [accountsResult, categoriesResult, transactionsResult] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("id, name")
        .eq("household_id", householdId)
        .eq("is_archived", false)
        .order("created_at", { ascending: true }),
      supabase
        .from("categories")
        .select("id, name, kind")
        .or(`household_id.is.null,household_id.eq.${householdId}`)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("transactions")
        .select(
          "id, type, amount, transaction_date, description, category_id, account_id, counterparty_account_id, paid_by_member_id",
        )
        .eq("household_id", householdId)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  const accounts = accountsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const memberIds = Array.from(
    new Set(
      (transactionsResult.data ?? [])
        .map((tx) => tx.paid_by_member_id)
        .filter(Boolean),
    ),
  );
  const profilesResult = memberIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", memberIds)
    : { data: [], error: null };
  const profileMap = new Map(
    (profilesResult.data ?? []).map((p) => [p.user_id, p.full_name]),
  );

  const listItems = (transactionsResult.data ?? []).map((tx) => ({
    id: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    transaction_date: tx.transaction_date,
    description: tx.description,
    category_id: tx.category_id,
    account_id: tx.account_id,
    counterparty_account_id: tx.counterparty_account_id,
    category_name: tx.category_id
      ? (categoryMap.get(tx.category_id) ?? null)
      : null,
    account_name: tx.account_id
      ? (accountMap.get(tx.account_id) ?? null)
      : null,
    counterparty_account_name: tx.counterparty_account_id
      ? (accountMap.get(tx.counterparty_account_id) ?? null)
      : null,
    member_name: tx.paid_by_member_id
      ? (profileMap.get(tx.paid_by_member_id) ?? null)
      : null,
  }));

  const quickCategories = categories
    .filter((category) => category.kind === "expense")
    .slice(0, 8)
    .map((category) => ({ id: category.id, name: category.name }));

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
      <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SectionHeader
          label={vi ? "Theo dõi dòng tiền" : "Cash Flow Tracking"}
          title={
            vi
              ? "Ghi nhanh, lịch sử gia đình rõ ràng"
              : "Fast logging, clear history"
          }
          description={
            vi
              ? "Thêm nhanh trên di động được tối ưu để ghi chi tiêu dưới 10 giây."
              : "Mobile quick add is optimized for logging under 10 seconds."
          }
        />

        {accounts.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title={vi ? "Chưa có tài khoản" : "No active accounts"}
            description={
              vi
                ? "Hãy thêm tài khoản trước trong mục Tài khoản để bắt đầu ghi giao dịch."
                : "Add your first account to start recording transactions."
            }
            action={
              <Button asChild>
                <Link href="/accounts">
                  {vi ? "Đến Tài khoản" : "Go to Accounts"}
                </Link>
              </Button>
            }
            className="bg-amber-50/50 border-amber-200"
          />
        ) : (
          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5 sm:hidden">
              <CardHeader>
                <SectionHeader
                  label="Speed"
                  title={vi ? "Thêm nhanh" : "Quick Add"}
                  description={
                    vi
                      ? "Nhập số tiền, chọn danh mục và hoàn tất."
                      : "Amount to category to done."
                  }
                />
              </CardHeader>
              <CardContent>
                <QuickAddForm
                  accountId={accounts[0]!.id}
                  categories={quickCategories}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <SectionHeader
                  label="Details"
                  title={vi ? "Nhập chi tiết" : "Detailed Entry"}
                  description={
                    vi
                      ? "Chính xác ngày, tài khoản và danh mục."
                      : "Precision date, account, and category."
                  }
                />
              </CardHeader>
              <CardContent>
                <DetailedTransactionForm
                  accounts={accounts.map((account) => ({
                    id: account.id,
                    name: account.name,
                  }))}
                  categories={categories
                    .filter(
                      (category) =>
                        category.kind === "income" ||
                        category.kind === "expense",
                    )
                    .map((category) => ({
                      id: category.id,
                      name: category.name,
                      kind: category.kind as "income" | "expense",
                    }))}
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <SectionHeader
                label="History"
                title={vi ? "Giao dịch gần đây" : "Recent Transactions"}
              />

              {transactionsResult.error ? (
                <EmptyState
                  icon={History}
                  title="Error loading history"
                  description={transactionsResult.error.message}
                  className="bg-destructive/5 border-destructive/20"
                />
              ) : listItems.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title={vi ? "Chưa có giao dịch" : "No transactions"}
                  description={
                    vi
                      ? "Bắt đầu thêm giao dịch đầu tiên của bạn."
                      : "Start adding your first transaction."
                  }
                />
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <TransactionsList
                      items={listItems}
                      accounts={accounts.map((account) => ({
                        id: account.id,
                        name: account.name,
                      }))}
                      categories={categories
                        .filter(
                          (category) =>
                            category.kind === "income" ||
                            category.kind === "expense",
                        )
                        .map((category) => ({
                          id: category.id,
                          name: category.name,
                          kind: category.kind as "income" | "expense",
                        }))}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
