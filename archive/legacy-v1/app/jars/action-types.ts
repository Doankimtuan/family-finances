export type JarBalancePreview = {
  jarId: string;
  jarName: string;
  openingBalance: number;
  allocatedAmount: number;
  spentAmount: number;
  transferIn: number;
  transferOut: number;
  closingBalanceBeforeRollover: number;
  plannedAmount: number;
};

export type OverspendCoveragePreview = {
  deficitJarId: string;
  deficitJarName: string;
  deficitAmount: number;
  sourceJarId: string;
  sourceJarName: string;
  coverAmount: number;
  remainingDeficit: number;
};

export type RolloverPreview = {
  jarId: string;
  jarName: string;
  surplus: number;
  action: "carry_forward" | "sweep_out" | "none";
  targetJarId?: string;
  targetJarName?: string;
  amount: number;
};

export type ClosePreview = {
  month: string;
  closeRunId: string;
  jarBalances: JarBalancePreview[];
  overspendCoverage: OverspendCoveragePreview[];
  rollovers: RolloverPreview[];
  totalSurplus: number;
  totalDeficit: number;
};

export type JarActionState = {
  status: "idle" | "error" | "success";
  message: string;
  updatedCount?: number;
  movementCount?: number;
  eventCount?: number;
  snapshotCount?: number;
  closeRunId?: string;
  movementId?: string;
  totalSurplus?: number;
  totalDeficit?: number;
  month?: string;
  jarBalances?: ClosePreview["jarBalances"];
  overspendCoverage?: ClosePreview["overspendCoverage"];
  rollovers?: ClosePreview["rollovers"];
  amount?: number;
};

export const initialJarActionState: JarActionState = {
  status: "idle",
  message: "",
};
