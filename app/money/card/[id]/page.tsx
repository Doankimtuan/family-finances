import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatVnd, formatVndCompact } from "@/lib/dashboard/format";
import { getAuthenticatedHouseholdContext } from "@/lib/server/household";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  History,
  ArrowDownToLine,
  CheckCircle2,
  ChevronRight,
  Banknote,
  RefreshCw,
} from "lucide-react";
import { SettleCardForm } from "../_components/settle-card-form";
import { ConvertToInstallmentDialog } from "../_components/convert-to-installment-dialog";

type BillingItem = {
  id: string;
  description: string;
  amount: number;
  fee_amount: number;
  item_type: string;
  is_paid: boolean;
  is_converted_to_installment: boolean;
  installment_sequence: number | null;
};

type BillingMonth = {
  id: string;
  billing_month: string;
  statement_amount: number;
  paid_amount: number;
  status: string;
  items: BillingItem[];
};

export default async function CreditCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { householdId, householdLocale, language } =
    await getAuthenticatedHouseholdContext();
  const vi = language === "vi";
  const { id } = await params;
  const supabase = await createClient();

  const [accountResult, settingsResult, installmentsResult, billingResult] =
    await Promise.all([
      supabase
        .from("accounts")
        .select("*")
        .eq("household_id", householdId)
        .eq("id", id)
        .eq("type", "credit_card")
        .maybeSingle(),
      supabase
        .from("credit_card_settings")
        .select(
          "*, linked_bank_account:accounts!linked_bank_account_id(id, name)",
        )
        .eq("account_id", id)
        .maybeSingle(),
      supabase
        .from("installment_plans")
        .select("*")
        .eq("household_id", householdId)
        .eq("card_account_id", id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("card_billing_months")
        .select(`*, items:card_billing_items(*)`)
        .eq("card_account_id", id)
        .order("billing_month", { ascending: false })
        .limit(12),
    ]);

  const account = accountResult.data;
  if (!account) notFound();

  const settings = settingsResult.data;
  const linkedAccountName =
    (settings as { linked_bank_account?: { name?: string } | null } | null)
      ?.linked_bank_account?.name ?? null;
  const installments = installmentsResult.data ?? [];
  const billingMonths = (billingResult.data ?? []) as BillingMonth[];

  const balance = billingMonths.reduce((acc, month) => {
    return acc + (Number(month.statement_amount) - Number(month.paid_amount));
  }, 0);

  const creditLimit = Number(settings?.credit_limit ?? 0);
  const availableCredit = Math.max(0, creditLimit - balance);
  const rawUsage = creditLimit > 0 ? (balance / creditLimit) * 100 : 0;
  // Show 1 decimal for <1%, integer for larger amounts
  const usageDisplay =
    rawUsage > 0 && rawUsage < 1
      ? rawUsage.toFixed(1)
      : Math.round(rawUsage).toString();
  // Bar width: minimum 1% visible when there is any balance
  const usagePercent =
    balance > 0 ? Math.max(1, Math.min(100, Math.round(rawUsage))) : 0;
  const openCycles = billingMonths.filter((m) => m.status !== "settled");

  return (
    <AppShell
      header={<AppHeader title={account.name} showBack />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6 pb-28">
        {/* ── HERO CARD ── */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-800 via-slate-700 to-slate-900 p-6 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-10 -left-4 h-28 w-28 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  {vi ? "Dư nợ cần thanh toán" : "Outstanding Balance"}
                </p>
                <h2 className="mt-1 text-4xl font-black tracking-tight">
                  {formatVnd(balance, householdLocale)}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>

            {creditLimit > 0 && (
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs text-white/60">
                  <span>
                    {vi ? "Đã dùng" : "Used"} {usageDisplay}%
                  </span>
                  <span>
                    {vi ? "Hạn mức" : "Limit"}:{" "}
                    {formatVndCompact(creditLimit, householdLocale)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div
                    className={`h-2 rounded-full transition-all ${usagePercent > 80 ? "bg-rose-400" : usagePercent > 50 ? "bg-amber-400" : "bg-emerald-400"}`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-white/50">
                    {vi ? "Còn khả dụng" : "Available"}
                  </span>
                  <span className="font-bold text-emerald-400">
                    {formatVndCompact(availableCredit, householdLocale)}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-4 border-t border-white/10 pt-4 text-xs">
              <div>
                <p className="text-white/40">
                  {vi ? "Ngày kết sổ" : "Statement"}
                </p>
                <p className="font-bold text-white">
                  {vi
                    ? `Ngày ${settings?.statement_day}`
                    : `Day ${settings?.statement_day}`}
                </p>
              </div>
              <div>
                <p className="text-white/40">{vi ? "Hạn TT" : "Due Day"}</p>
                <p className="font-bold text-white">
                  {vi
                    ? `Ngày ${settings?.due_day}`
                    : `Day ${settings?.due_day}`}
                </p>
              </div>
              {linkedAccountName && (
                <div className="min-w-0 flex-1">
                  <p className="text-white/40">
                    {vi ? "TK liên kết" : "Linked"}
                  </p>
                  <p className="truncate font-bold text-white">
                    {linkedAccountName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="#settle"
            className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 transition-all hover:bg-emerald-100 active:scale-95"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-800">
                {vi ? "Thanh toán thẻ" : "Pay Card"}
              </p>
              <p className="text-[10px] text-emerald-700/60">
                {vi ? "Chuyển khoản FIFO" : "Transfer FIFO"}
              </p>
            </div>
          </a>

          <a
            href="#history"
            className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-all hover:bg-amber-100 active:scale-95"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-amber-800">
                {vi ? "Chuyển trả góp" : "Convert to EMI"}
              </p>
              <p className="text-[10px] text-amber-700/60">
                {vi ? "Chọn giao dịch bên dưới" : "Pick a transaction below"}
              </p>
            </div>
          </a>
        </div>

        {/* ── SETTLEMENT ── */}
        <section id="settle" className="scroll-mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Banknote className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wide text-foreground">
              {vi ? "Thanh toán thẻ (FIFO)" : "Pay Card Balance (FIFO)"}
            </h3>
          </div>
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-3 rounded-xl bg-emerald-100/60 p-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 mt-0.5" />
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {vi
                    ? "Nhập số tiền và chọn tài khoản ngân hàng để thanh toán. Hệ thống sẽ tự động trả dứt điểm kỳ sao kê cũ nhất trước (FIFO)."
                    : "Enter amount and choose source bank account. Payments clear the oldest billing cycle first (FIFO)."}
                </p>
              </div>
              <SettleCardForm cardId={id} currentBalance={balance} vi={vi} />
            </CardContent>
          </Card>
        </section>

        {/* ── ACTIVE INSTALLMENT PLANS ── */}
        {installments.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
                <RefreshCw className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wide text-foreground">
                {vi ? "Kế hoạch trả góp đang chạy" : "Active Installment Plans"}
              </h3>
            </div>
            <div className="space-y-2">
              {installments.map((plan) => (
                <Card key={plan.id} className="border-amber-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {plan.description}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {plan.paid_installments}/{plan.num_installments}{" "}
                          {vi ? "kỳ" : "months"}&nbsp;·&nbsp;
                          {formatVnd(
                            Number(plan.monthly_amount),
                            householdLocale,
                          )}
                          /{vi ? "tháng" : "mo"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-amber-700">
                          {formatVndCompact(
                            Number(plan.remaining_amount),
                            householdLocale,
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {vi ? "còn lại" : "remaining"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-amber-100">
                      <div
                        className="h-1.5 rounded-full bg-amber-500 transition-all"
                        style={{
                          width: `${Math.round((plan.paid_installments / plan.num_installments) * 100)}%`,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* ── BILLING CYCLES & TRANSACTIONS ── */}
        <section id="history" className="scroll-mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700 text-white">
              <History className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wide text-foreground">
              {vi ? "Lịch sử kỳ sao kê" : "Billing Cycles History"}
            </h3>
            {openCycles.length > 0 && (
              <Badge
                variant="outline"
                className="ml-auto text-[10px] border-rose-300 text-rose-600 bg-rose-50"
              >
                {openCycles.length} {vi ? "kỳ chưa TT" : "unpaid"}
              </Badge>
            )}
          </div>

          {/* Instruction hint for converting to installments */}
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
            <RefreshCw className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              {vi
                ? 'Nhấn nút "Trả góp" trên từng giao dịch để chuyển nó thành các kỳ trả góp hàng tháng. Số tiền gốc sẽ được xóa khỏi kỳ đó và thay bằng khoản trả góp tương ứng.'
                : 'Tap the "EMI" button on any transaction to split it into monthly installments. The original amount is removed from that cycle and replaced with the monthly installment amount.'}
            </p>
          </div>

          {billingMonths.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CreditCard className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground italic">
                  {vi
                    ? "Chưa có kỳ sao kê nào. Ghi giao dịch chi tiêu bằng thẻ này để bắt đầu."
                    : "No billing cycles yet. Record a transaction using this card to begin."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {billingMonths.map((month) => {
                const remaining =
                  Number(month.statement_amount) - Number(month.paid_amount);
                const isSettled = month.status === "settled";
                const isPartial = month.status === "partial";

                return (
                  <Card
                    key={month.id}
                    className={`overflow-hidden transition-all ${
                      isSettled
                        ? "border-emerald-100 bg-emerald-50/30 opacity-75"
                        : isPartial
                          ? "border-amber-200 bg-amber-50/30"
                          : "border-rose-200 bg-rose-50/30"
                    }`}
                  >
                    {/* Month header */}
                    <CardHeader className="pb-3 pt-4 px-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-black capitalize">
                            {new Intl.DateTimeFormat(vi ? "vi-VN" : "en-US", {
                              month: "long",
                              year: "numeric",
                            }).format(new Date(month.billing_month))}
                          </h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {vi ? "Tổng phát sinh" : "Total"}:{" "}
                            <span className="font-bold">
                              {formatVnd(
                                Number(month.statement_amount),
                                householdLocale,
                              )}
                            </span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge
                            className={`text-[10px] uppercase font-bold ${
                              isSettled
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : isPartial
                                  ? "bg-amber-100 text-amber-700 border-amber-200"
                                  : "bg-rose-100 text-rose-700 border-rose-200"
                            }`}
                            variant="outline"
                          >
                            {isSettled
                              ? vi
                                ? "✓ Đã TT"
                                : "✓ Settled"
                              : isPartial
                                ? vi
                                  ? "Trả một phần"
                                  : "Partial"
                                : vi
                                  ? "Chưa TT"
                                  : "Unpaid"}
                          </Badge>
                          {!isSettled && remaining > 0 && (
                            <p className="text-xs font-black text-rose-600 mt-1">
                              -{formatVnd(remaining, householdLocale)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Payment progress */}
                      {Number(month.statement_amount) > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>
                              {vi ? "Đã trả" : "Paid"}:{" "}
                              {formatVndCompact(
                                Number(month.paid_amount),
                                householdLocale,
                              )}
                            </span>
                            <span>
                              {Math.round(
                                (Number(month.paid_amount) /
                                  Number(month.statement_amount)) *
                                  100,
                              )}
                              %
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-black/10">
                            <div
                              className={`h-1.5 rounded-full transition-all ${isSettled ? "bg-emerald-500" : isPartial ? "bg-amber-500" : "bg-rose-400"}`}
                              style={{
                                width: `${Math.min(100, Math.round((Number(month.paid_amount) / Number(month.statement_amount)) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </CardHeader>

                    {/* Billing items */}
                    {month.items.length > 0 && (
                      <CardContent className="p-0 border-t border-dashed border-black/5">
                        <div className="divide-y divide-black/5">
                          {month.items.map((item) => {
                            const isConverted =
                              item.is_converted_to_installment;
                            const isInstallment =
                              item.item_type === "installment";
                            const canConvert =
                              !isConverted && !isInstallment && !isSettled;

                            return (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between gap-2 px-4 py-3 text-xs transition-colors ${
                                  isConverted
                                    ? "opacity-40"
                                    : "hover:bg-muted/20"
                                }`}
                              >
                                <div className="flex items-start gap-2 min-w-0 flex-1">
                                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span
                                        className={`font-semibold truncate ${isConverted ? "line-through" : ""}`}
                                      >
                                        {item.description ||
                                          (vi
                                            ? "Giao dịch thẻ"
                                            : "Card transaction")}
                                      </span>
                                      {isInstallment && (
                                        <Badge className="h-3.5 shrink-0 px-1 text-[8px] bg-amber-100 text-amber-700 border-amber-300">
                                          {vi
                                            ? `Góp ${item.installment_sequence}`
                                            : `EMI ${item.installment_sequence}`}
                                        </Badge>
                                      )}
                                      {isConverted && (
                                        <Badge className="h-3.5 shrink-0 px-1 text-[8px] bg-slate-100 text-slate-500 border-slate-200">
                                          {vi ? "→ Trả góp" : "→ EMI"}
                                        </Badge>
                                      )}
                                    </div>
                                    <p
                                      className={`text-[10px] mt-0.5 ${item.is_paid ? "text-emerald-600" : "text-muted-foreground"}`}
                                    >
                                      {item.is_paid
                                        ? vi
                                          ? "✓ Đã TT"
                                          : "✓ Paid"
                                        : isConverted
                                          ? vi
                                            ? "Đã chuyển trả góp"
                                            : "Converted to EMI"
                                          : vi
                                            ? "Chờ TT"
                                            : "Pending"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Convert to installment button — only on standard unpaid items */}
                                  {canConvert && (
                                    <ConvertToInstallmentDialog
                                      item={{
                                        id: item.id,
                                        description: item.description,
                                        amount: Number(item.amount),
                                        fee_amount: Number(item.fee_amount),
                                      }}
                                      locale={householdLocale}
                                      vi={vi}
                                    />
                                  )}
                                  <div className="text-right">
                                    <p
                                      className={`font-black ${isConverted ? "text-muted-foreground" : ""}`}
                                    >
                                      {formatVnd(
                                        Number(item.amount),
                                        householdLocale,
                                      )}
                                    </p>
                                    {Number(item.fee_amount) > 0 && (
                                      <p className="text-[9px] text-rose-500">
                                        +
                                        {formatVnd(
                                          Number(item.fee_amount),
                                          householdLocale,
                                        )}{" "}
                                        {vi ? "phí" : "fee"}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    )}

                    {month.items.length === 0 && (
                      <CardContent className="p-4 text-center">
                        <p className="text-[10px] text-muted-foreground italic">
                          {vi
                            ? "Chưa có giao dịch trong kỳ này"
                            : "No items in this cycle"}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
