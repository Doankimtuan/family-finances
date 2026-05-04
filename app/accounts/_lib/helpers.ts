/**
 * Pure helper functions for the accounts page sections.
 * All functions are stateless — no Supabase, no async.
 */
import {
  Banknote,
  Car,
  Coins,
  Home,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";

// ─── Account helpers ────────────────────────────────────────────────────────

export function getAccountIcon(type: string) {
  switch (type) {
    case "savings":
      return PiggyBank;
    case "wallet":
      return Wallet;
    default:
      return Landmark;
  }
}

export function getAccountColors(type: string) {
  switch (type) {
    case "checking":
      return {
        border: "border-blue-200 dark:border-blue-900/50",
        bg: "bg-blue-50/60 dark:bg-blue-950/20",
        icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/40",
        label: "text-blue-500",
        value: "text-blue-700 dark:text-blue-300",
      };
    case "savings":
      return {
        border: "border-emerald-200 dark:border-emerald-900/50",
        bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
        icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40",
        label: "text-emerald-500",
        value: "text-emerald-700 dark:text-emerald-300",
      };
    case "wallet":
      return {
        border: "border-amber-200 dark:border-amber-900/50",
        bg: "bg-amber-50/60 dark:bg-amber-950/20",
        icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/40",
        label: "text-amber-500",
        value: "text-amber-700 dark:text-amber-300",
      };
    default:
      return {
        border: "border-border",
        bg: "bg-card",
        icon: "bg-primary/10 text-primary",
        label: "text-muted-foreground",
        value: "text-foreground",
      };
  }
}

export function getAccountTypeLabel(type: string, t: (key: string) => string) {
  const map: Record<string, string> = {
    checking: "money.accounts.type.checking",
    savings: "money.accounts.type.savings",
    wallet: "money.accounts.type.wallet",
    credit_card: "money.accounts.type.credit_card",
  };
  const key = map[type];
  return key ? t(key) : type.replace(/_/g, " ");
}

// ─── Liability helpers ──────────────────────────────────────────────────────

export function getLiabilityLabel(type: string, t: (key: string) => string) {
  const map: Record<string, string> = {
    mortgage: "money.liabilities.type.mortgage",
    personal_loan: "money.liabilities.type.personal_loan",
    car_loan: "money.liabilities.type.car_loan",
    credit_card: "money.accounts.type.credit_card",
    family_loan: "money.liabilities.type.family_loan",
    other: "money.liabilities.type.other",
  };
  const key = map[type];
  return key ? t(key) : type.replace(/_/g, " ");
}

export function getLiabilityIcon(type: string) {
  switch (type) {
    case "mortgage":
      return Home;
    case "car_loan":
      return Car;
    case "family_loan":
      return MoreHorizontal;
    default:
      return Banknote;
  }
}

export function getLiabilityColors(type: string) {
  switch (type) {
    case "mortgage":
      return {
        border: "border-blue-200 dark:border-blue-900/50",
        bg: "bg-blue-50/40 dark:bg-blue-950/20",
      };
    case "car_loan":
      return {
        border: "border-sky-200 dark:border-sky-900/50",
        bg: "bg-sky-50/40 dark:bg-sky-950/20",
      };
    case "family_loan":
      return {
        border: "border-amber-200 dark:border-amber-900/50",
        bg: "bg-amber-50/40 dark:bg-amber-950/20",
      };
    default:
      return { border: "border-border", bg: "bg-card" };
  }
}

export function calcRemainingMonths(
  startDate: string,
  termMonths: number | null,
): number | null {
  if (!termMonths) return null;
  const start = new Date(startDate);
  const now = new Date();
  const elapsed =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.max(0, termMonths - elapsed);
}

// ─── Credit card helpers ────────────────────────────────────────────────────

export function calcDueDate(
  statementDay: number,
  dueDay: number,
  t: (key: string) => string,
): { label: string; urgent: boolean } {
  const now = new Date();
  let dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (dueDate < now) {
    dueDate = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
  }
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000);
  const urgent = diffDays <= 3;
  if (diffDays === 0) return { label: t("common.today"), urgent: true };
  return {
    label: t("common.days_left").replace("{count}", String(diffDays)),
    urgent,
  };
}

// ─── Asset helpers ──────────────────────────────────────────────────────────

export function getAssetIcon(cls: string) {
  switch (cls) {
    case "gold":
      return Coins;
    case "real_estate":
      return Home;
    case "vehicle":
      return Car;
    case "mutual_fund":
    case "stock":
    case "crypto":
      return TrendingUp;
    default:
      return TrendingUp;
  }
}

export function getAssetColors(cls: string) {
  switch (cls) {
    case "gold":
      return {
        border: "border-yellow-200 dark:border-yellow-900/50",
        bg: "bg-yellow-50/60 dark:bg-yellow-950/20",
        icon: "bg-yellow-100 text-yellow-700",
      };
    case "real_estate":
      return {
        border: "border-sky-200 dark:border-sky-900/50",
        bg: "bg-sky-50/60 dark:bg-sky-950/20",
        icon: "bg-sky-100 text-sky-700",
      };
    case "vehicle":
      return {
        border: "border-blue-200 dark:border-blue-900/50",
        bg: "bg-blue-50/60 dark:bg-blue-950/20",
        icon: "bg-blue-100 text-blue-700",
      };
    case "savings_deposit":
      return {
        border: "border-emerald-200 dark:border-emerald-900/50",
        bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
        icon: "bg-emerald-100 text-emerald-700",
      };
    case "crypto":
      return {
        border: "border-purple-200 dark:border-purple-900/50",
        bg: "bg-purple-50/60 dark:bg-purple-950/20",
        icon: "bg-purple-100 text-purple-700",
      };
    case "mutual_fund":
    case "stock":
      return {
        border: "border-indigo-200 dark:border-indigo-900/50",
        bg: "bg-indigo-50/60 dark:bg-indigo-950/20",
        icon: "bg-indigo-100 text-indigo-700",
      };
    default:
      return {
        border: "border-teal-200 dark:border-teal-900/50",
        bg: "bg-teal-50/60 dark:bg-teal-950/20",
        icon: "bg-teal-100 text-teal-700",
      };
  }
}

/** Asset class colour map for allocation bar segments */
export const ASSET_CLASS_BAR_COLORS: Record<string, string> = {
  gold: "bg-yellow-500",
  real_estate: "bg-sky-500",
  mutual_fund: "bg-indigo-500",
  stock: "bg-indigo-400",
  crypto: "bg-purple-500",
  savings_deposit: "bg-emerald-500",
  vehicle: "bg-blue-500",
};

/** Asset class text colour map for legend dots */
export const ASSET_CLASS_TEXT_COLORS: Record<string, string> = {
  gold: "text-yellow-500",
  real_estate: "text-sky-500",
  mutual_fund: "text-indigo-500",
  stock: "text-indigo-400",
  crypto: "text-purple-500",
  savings_deposit: "text-emerald-500",
  vehicle: "text-blue-500",
};
