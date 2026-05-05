import type { SpendingJarAlertLevel } from "@/lib/jars/spending";

type TransactionSpendingJarWarning = {
  jarId: string;
  jarName: string;
  alertLevel: SpendingJarAlertLevel;
  usagePercent: number | null;
  spent: number;
  limit: number;
};

export type TransactionActionState = {
  status: "idle" | "error" | "success";
  message: string;
  spendingJarWarning?: TransactionSpendingJarWarning | null;
};

export const initialTransactionActionState: TransactionActionState = {
  status: "idle",
  message: "",
  spendingJarWarning: null,
};
