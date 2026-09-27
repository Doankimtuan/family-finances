"use client";

import {
  FinancialAmount,
  FinancialAmountSize,
  FinancialAmountTone,
  KeyValueList,
  KeyValueRow,
  ProgressSummary,
} from "@/shared/ui";
import {
  FinancialMetric,
  TransactionRow,
  TransactionType,
  AccountRow,
  SavingsRow,
  InvestmentRow,
  LoanRow,
  PersonalDebtRow,
  InboxRow,
  MemberRow,
  ProviderRow,
  StatusRow,
} from "@/shared/patterns";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";

export function SharedFinancialRowsSection() {
  return (
    <section
      className="flex flex-col gap-6"
      data-testid="shared-financial-rows-section"
    >
      <div className="flex flex-col gap-1 border-b border-border-subtle pb-2">
        <h2 className="text-headline-md font-semibold text-text-primary">
          Implementation 05 — Shared Financial & Row Components
        </h2>
        <p className="text-sm text-text-secondary">
          Canonical composite patterns, financial presentations, and structured
          feed rows.
        </p>
      </div>

      {/* 1. FinancialAmount Gallery */}
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-primary">
          1. FinancialAmount Hierarchy & Tones
        </h3>
        <div className="flex flex-wrap items-baseline gap-4">
          <FinancialAmount
            value={1250000000}
            size={FinancialAmountSize.DISPLAY_HERO}
          />
          <FinancialAmount
            value={85000000}
            size={FinancialAmountSize.SECTION_TOTAL}
          />
          <FinancialAmount
            value={24500000}
            size={FinancialAmountSize.METRIC_MEDIUM}
          />
          <FinancialAmount
            value={1850000}
            size={FinancialAmountSize.ROW_AMOUNT}
          />
          <FinancialAmount
            value={250000}
            size={FinancialAmountSize.MICRO_AMOUNT}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border-subtle">
          <FinancialAmount
            value={3500000}
            tone={FinancialAmountTone.INCOME}
            showSign
          />
          <FinancialAmount
            value={1250000}
            tone={FinancialAmountTone.EXPENSE}
            showSign
          />
          <FinancialAmount
            value={5000000}
            tone={FinancialAmountTone.TRANSFER}
            showSign
          />
          <FinancialAmount value={85000000} tone={FinancialAmountTone.DEBT} />
          <FinancialAmount value={450000} tone={FinancialAmountTone.MUTED} />
        </div>
      </div>

      {/* 2. FinancialMetric & KeyValueList */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4">
          <h3 className="text-sm font-semibold text-text-primary">
            2. FinancialMetric
          </h3>
          <FinancialMetric
            label="Tổng tài sản ròng"
            amount={1450000000}
            supportingText="+8.5% so với tháng trước"
            badge={
              <span className="text-xs font-semibold text-income bg-income/10 px-2 py-0.5 rounded-full">
                +115tr
              </span>
            }
          />
        </div>

        <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4">
          <h3 className="text-sm font-semibold text-text-primary">
            3. KeyValueList
          </h3>
          <KeyValueList>
            <KeyValueRow label="Mã giao dịch" value="TX-8829103" />
            <KeyValueRow label="Thời gian" value="14:32 · Hôm nay" />
            <KeyValueRow
              label="Số tiền thanh toán"
              value={
                <FinancialAmount
                  value={2450000}
                  tone={FinancialAmountTone.EXPENSE}
                  showSign
                />
              }
              highlight
            />
          </KeyValueList>
        </div>
      </div>

      {/* 4. ProgressSummary (Clamped vs Overage) */}
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-primary">
          4. ProgressSummary (Clamping & Overage Discipline)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProgressSummary
            label="Quỹ khẩn cấp (Đang tiến triển 75%)"
            currentAmount={75000000}
            targetAmount={100000000}
            tone="income"
          />
          <ProgressSummary
            label="Ngân sách ăn uống (Vượt mức 120%)"
            currentAmount={12000000}
            targetAmount={10000000}
            tone="debt"
          />
        </div>
      </div>

      {/* 5. TransactionRow Feeds (Income vs Expense vs Transfer P0) */}
      <div className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border-subtle bg-surface overflow-hidden">
        <div className="p-3 border-b border-border-subtle font-semibold text-sm">
          5. TransactionRow (Explicit Transfer ≠ Expense Discipline)
        </div>
        <TransactionRow
          type={TransactionType.INCOME}
          title="Lương tháng 09"
          subtitle="Techcorp Vietnam · Vietcombank"
          amount={45000000}
          icon={FINANCE_ICONS.cash}
          iconTone="income"
        />
        <TransactionRow
          type={TransactionType.EXPENSE}
          title="Siêu thị An Nam Gourmet"
          subtitle="Ăn uống · Thẻ VIB Cash Back"
          amount={1850000}
          icon={FINANCE_ICONS.card}
          iconTone="debt"
        />
        <TransactionRow
          type={TransactionType.TRANSFER}
          title="Chuyển tiền tiết kiệm"
          subtitle="Ví chính → Quỹ sinh lời BIDV"
          amount={10000000}
          icon={FINANCE_ICONS.transfer}
          iconTone="primary"
        />
      </div>

      {/* 6. AccountRow & Banking Feeds */}
      <div className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border-subtle bg-surface overflow-hidden">
        <div className="p-3 border-b border-border-subtle font-semibold text-sm">
          6. AccountRow (Cash Asset vs Credit Liability Distinction)
        </div>
        <AccountRow
          accountName="Tài khoản thanh toán"
          institutionName="Techcombank"
          accountNumberMask="•••• 8821"
          balance={82400000}
        />
        <AccountRow
          accountName="Thẻ tín dụng VIB Cash Back"
          institutionName="VIB Bank"
          accountNumberMask="•••• 4019"
          isCredit
          balance={18500000}
          creditLimit={60000000}
        />
      </div>

      {/* 7. Savings, Investment & Loan Rows */}
      <div className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border-subtle bg-surface overflow-hidden">
        <div className="p-3 border-b border-border-subtle font-semibold text-sm">
          7. Financial Contracts (Savings, Investments, Loans)
        </div>
        <SavingsRow
          depositName="Tiết kiệm kỳ hạn 12 tháng"
          institutionName="VietinBank"
          principal={200000000}
          interestRatePercent={5.8}
          maturityDate="2027-09-15"
          accruedYield={5800000}
        />
        <InvestmentRow
          symbol="FPT"
          assetName="FPT Corporation"
          quantity={600}
          currentPrice={138000}
          marketValue={82800000}
          unrealizedGainLoss={12400000}
          unrealizedGainLossPercent={17.6}
        />
        <LoanRow
          loanName="Vay mua nhà"
          lenderName="VPBank"
          outstandingPrincipal={920000000}
          nextPaymentDate="15/10/2026"
          nextPaymentAmount={14200000}
        />
      </div>

      {/* 8. PersonalDebtRow (Peer Lending) */}
      <div className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border-subtle bg-surface overflow-hidden">
        <div className="p-3 border-b border-border-subtle font-semibold text-sm">
          8. PersonalDebtRow (Mandatory Textual Direction &quot;Cho vay&quot; /
          &quot;Đi vay&quot;)
        </div>
        <PersonalDebtRow
          counterpartyName="Nguyễn Văn Minh"
          direction="lending"
          remainingAmount={15000000}
          dueDate="Hạn trả 01/11/2026"
        />
        <PersonalDebtRow
          counterpartyName="Trần Hoàng Anh"
          direction="borrowing"
          remainingAmount={8000000}
          dueDate="Hạn trả 20/10/2026"
        />
      </div>

      {/* 9. Operational & Diagnostic Rows */}
      <div className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-border-subtle bg-surface overflow-hidden">
        <div className="p-3 border-b border-border-subtle font-semibold text-sm">
          9. Operational, Inbox, Member & Status Rows
        </div>
        <InboxRow
          title="Hóa đơn tiền điện EVN đến hạn"
          subtitle="Hạn thanh toán ngày mai"
          categoryBadge="Điện nước"
          urgency="urgent"
          impactAmount={1850000}
        />
        <MemberRow
          displayName="Đoàn Kim Tuấn"
          email="tuan@example.com"
          role="Chủ hộ"
          isActive
        />
        <ProviderRow
          providerName="Vietcombank"
          accountIdentifier="•••• 1024"
          connectionStatus="connected"
        />
        <StatusRow
          title="Đồng bộ tự động đang hoạt động"
          description="Lần cập nhật gần nhất: 12 phút trước"
          actionLabel="Đồng bộ ngay"
          onAction={() => {}}
        />
      </div>
    </section>
  );
}
