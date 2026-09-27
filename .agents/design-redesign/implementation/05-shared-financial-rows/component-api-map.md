# Implementation 05 — Component API Map

**Phase**: Implementation 05 — Shared Financial & Row Components  
**Standard**: Task 11 ("Warm Precision")

---

## 1. Primitives & Composites

### `FinancialAmount`

```typescript
export type FinancialAmountSize =
  | "displayHero" // 32px / 38px line-height, 600 weight
  | "sectionTotal" // 24px / 30px line-height, 600 weight
  | "metricMedium" // 18px / 24px line-height, 500 weight
  | "rowAmount" // 15px / 20px line-height, 500 weight
  | "microAmount"; // 12px / 16px line-height, 500 weight

export type FinancialAmountTone =
  | "income" // Emerald (#059669 / #34D399), + prefix
  | "expense" // Slate (#475569 / #94A3B8), − prefix
  | "debt" // Crimson / Rose (#E11D48 / #FB7185)
  | "transfer" // Sky blue (#0284C7 / #38BDF8), ⇄ prefix
  | "neutral" // Primary text (#1C1C1F / #F4F4F5)
  | "muted"; // Muted secondary text

export type FinancialAmountProps = {
  value?: number | null;
  amountLabel?: string;
  currency?: string;
  size?: FinancialAmountSize;
  tone?: FinancialAmountTone;
  showSign?: boolean;
  privacyAware?: boolean;
  className?: string;
  testId?: string;
};
```

### `FinancialMetric`

```typescript
export type FinancialMetricProps = {
  label: ReactNode;
  value?: number | null;
  amountLabel?: string;
  currency?: string;
  size?: FinancialAmountSize;
  tone?: FinancialAmountTone;
  supportingText?: ReactNode;
  badge?: ReactNode;
  className?: string;
  testId?: string;
};
```

### `KeyValueList` & `KeyValueRow`

```typescript
export type KeyValueRowProps = {
  label: ReactNode;
  value: ReactNode;
  dotLeader?: boolean;
  isHighlighted?: boolean;
  className?: string;
  testId?: string;
};

export type KeyValueListProps = {
  children: ReactNode;
  divider?: boolean;
  className?: string;
  testId?: string;
};
```

### `BaseRow`

```typescript
export type BaseRowProps = {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  action?: ReactNode;
  divider?: "inset" | "full" | "none";
  href?: string;
  onClick?: () => void;
  onPress?: () => void;
  minHeight?: "standard" | "instrument"; // 52px vs 64px
  className?: string;
  testId?: string;
};
```

### `NavigationRow`

```typescript
export type NavigationRowProps = {
  href?: string;
  onClick?: () => void;
  icon?: IconSvgElement;
  iconNode?: ReactNode;
  iconTone?: IconContainerTone;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  metadata?: ReactNode;
  divider?: "inset" | "full" | "none";
  className?: string;
  testId?: string;
};
```

### `FinancialRow`

```typescript
export type FinancialRowProps = {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  amount: ReactNode;
  amountMeta?: ReactNode;
  action?: ReactNode;
  href?: string;
  onClick?: () => void;
  divider?: "inset" | "full" | "none";
  className?: string;
  testId?: string;
};
```

### `TransactionRow`

```typescript
export type TransactionType =
  "expense" | "income" | "transfer" | "refund" | "neutral";

export type TransactionRowProps = {
  type?: TransactionType;
  title: ReactNode;
  subtitle?: ReactNode;
  amount: number | string;
  currency?: string;
  amountMeta?: ReactNode;
  icon?: IconSvgElement;
  iconNode?: ReactNode;
  iconTone?: IconContainerTone;
  href?: string;
  onClick?: () => void;
  showChevron?: boolean;
  showRail?: boolean;
  tone?: TransactionAmountTone;
  divider?: "inset" | "full" | "none";
  className?: string;
  testId?: string;
};
```

### `AccountRow`

```typescript
export type AccountKind = "asset" | "credit";

export type AccountRowProps = {
  accountKind?: AccountKind;
  name: ReactNode;
  accountNumberMask?: string;
  institutionName?: string;
  logo?: ReactNode;
  balance: number | string;
  creditLimit?: number | string;
  currency?: string;
  href?: string;
  onClick?: () => void;
  secondaryAction?: ReactNode;
  divider?: "inset" | "full" | "none";
  className?: string;
  testId?: string;
};
```

### `SavingsRow`

```typescript
export type SavingsRowProps = {
  depositName: ReactNode;
  providerName?: string;
  logo?: ReactNode;
  interestRate?: string;
  maturityDate?: string;
  principal: number | string;
  accruedYield?: number | string;
  statusBadge?: ReactNode;
  currency?: string;
  href?: string;
  onClick?: () => void;
  divider?: "inset" | "full" | "none";
  className?: string;
  testId?: string;
};
```

### `InvestmentRow`

```typescript
export type InvestmentRowProps = {
  assetName: ReactNode;
  ticker?: string;
  icon?: ReactNode;
  quantity?: number | string;
  unitPrice?: number | string;
  marketValue: number | string;
  gainLossAmount?: number | string;
  gainLossPercent?: string;
  gainLossTone?: "positive" | "negative" | "neutral";
  currency?: string;
  href?: string;
  onClick?: () => void;
  divider?: "inset" | "full" | "none";
  className?: string;
  testId?: string;
};
```

### `LoanRow`

```typescript
export type LoanRowProps = {
  loanName: ReactNode;
  lenderName?: string;
  logo?: ReactNode;
  outstandingPrincipal: number | string;
  nextPaymentAmount?: number | string;
  nextPaymentDate?: string;
  statusBadge?: ReactNode;
  currency?: string;
  href?: string;
  onClick?: () => void;
  divider?: "inset" | "full" | "none";
  className?: string;
  testId?: string;
};
```

### `PersonalDebtRow`

```typescript
export type PersonalDebtDirection = "lent" | "borrowed";

export type PersonalDebtRowProps = {
  direction: PersonalDebtDirection;
  directionLabel: string; // Mandatory explicit textual label: "Cho vay" or "Đi vay"
  counterpartyName: ReactNode;
  counterpartyAvatar?: ReactNode;
  remainingAmount: number | string;
  dueDate?: string;
  statusBadge?: ReactNode;
  currency?: string;
  href?: string;
  onClick?: () => void;
  divider?: "inset" | "full" | "none";
  className?: string;
  testId?: string;
};
```

### `InboxRow`

```typescript
export type InboxAccent = "amber" | "violet" | "rose" | "teal" | "neutral";

export type InboxRowProps = {
  accent?: InboxAccent;
  title: ReactNode;
  subtitle?: ReactNode;
  categoryBadge?: ReactNode;
  urgencyLabel?: ReactNode;
  impactAmount?: number | string;
  currency?: string;
  href?: string;
  onClick?: () => void;
  action?: ReactNode;
  className?: string;
  testId?: string;
};
```

### `MemberRow`

```typescript
export type MemberRowProps = {
  displayName: ReactNode;
  initials?: string;
  avatarUrl?: string;
  email?: ReactNode;
  roleBadge: ReactNode;
  statusActive?: boolean;
  activeLabel?: string;
  action?: ReactNode;
  href?: string;
  onClick?: () => void;
  divider?: "inset" | "full" | "none";
  className?: string;
  testId?: string;
};
```

### `ProviderLogo` & `ProviderRow`

```typescript
export type ProviderLogoProps = {
  src?: string;
  name: string;
  initials?: string;
  fallbackIcon?: IconSvgElement;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export type ProviderRowProps = {
  name: ReactNode;
  logo: ReactNode;
  categoryDetail?: ReactNode;
  action?: ReactNode;
  isSelected?: boolean;
  href?: string;
  onClick?: () => void;
  divider?: "inset" | "full" | "none";
  className?: string;
  testId?: string;
};
```

### `ProgressSummary`

```typescript
export type ProgressSummaryProps = {
  label: ReactNode;
  currentAmount: number | string;
  targetAmount: number | string;
  currency?: string;
  percent: number; // 0 to 100+
  overageLabel?: ReactNode;
  tone?: "primary" | "income" | "debt" | "warning";
  className?: string;
  testId?: string;
};
```

### `StatusRow`

```typescript
export type StatusRowProps = {
  icon?: IconSvgElement;
  iconTone?: IconContainerTone;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  testId?: string;
};
```
