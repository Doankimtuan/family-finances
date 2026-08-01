import {
  JarMovementType,
  JarEventType,
  OverspendPolicy,
  IncomeAutoAllocateMode,
  ExpenseAutoAllocateMode,
  MonthCloseMode,
} from "../_lib/types";

// ---------------------------------------------------------------------------
// Command inputs
// ---------------------------------------------------------------------------
export type JarLocation =
  | "external"
  | "cash"
  | "savings"
  | "investment"
  | "asset"
  | "expense";

export type JarSourceType =
  | "income_transaction"
  | "expense_transaction"
  | "transfer_transaction"
  | "savings_create"
  | "savings_withdraw"
  | "savings_mature"
  | "asset_buy"
  | "asset_sell"
  | "investment_buy"
  | "investment_sell"
  | "manual_adjustment";

export type CreateMovementCommand = {
  householdId: string;
  jarId: string;
  movementDate: string;
  amount: number;
  balanceDelta: -1 | 0 | 1;
  locationFrom: JarLocation | null;
  locationTo: JarLocation | null;
  sourceType: JarSourceType;
  sourceId: string;
  sourceLineKey: string;
  movementType: JarMovementType;
  idempotencyKey: string;
  relatedTransactionId?: string | null;
  relatedSavingsId?: string | null;
  note?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
  reviewQueueId?: string | null;
};

export type CreateEventCommand = {
  householdId: string;
  jarId: string | null;
  eventType: JarEventType;
  sourceType: string | null;
  sourceId: string | null;
  idempotencyKey: string;
  actorUserId?: string | null;
  payload?: Record<string, unknown>;
};

export type ResolveReviewCommand = {
  householdId: string;
  reviewId: string;
  userId: string;
  allocations: Array<{ jarId: string; amount: number }>;
};

export type TransferCommand = {
  householdId: string;
  userId: string;
  fromJarId: string;
  toJarId: string;
  amount: number;
  movementDate: string;
  note?: string | null;
};

export type CorrectionCommand = {
  householdId: string;
  userId: string;
  jarId: string;
  amount: number;
  balanceDelta: 1 | -1;
  movementDate: string;
  reason: string;
};

export type MonthClosePreviewCommand = {
  householdId: string;
  month: string;
};

export type MonthCloseApproveCommand = {
  householdId: string;
  userId: string;
  month: string;
  closeRunId: string;
};

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------
export type MovementResult = {
  id: string;
  idempotencyKey: string;
};

export type EventResult = {
  id: string;
  idempotencyKey: string;
};

export type AllocationResult = {
  queued: boolean;
  reviewId?: string;
  movements: MovementResult[];
  events: EventResult[];
};

export type TransferResult = {
  outMovement: MovementResult;
  inMovement: MovementResult;
  events: EventResult[];
};

export type CorrectionResult = {
  movement: MovementResult;
  event: EventResult;
};

export type JarBalanceSummary = {
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

export type OverspendCoverageItem = {
  deficitJarId: string;
  deficitJarName: string;
  deficitAmount: number;
  sourceJarId: string;
  sourceJarName: string;
  coverAmount: number;
  remainingDeficit: number;
};

export type RolloverItem = {
  jarId: string;
  jarName: string;
  surplus: number;
  action: "carry_forward" | "sweep_out" | "none";
  targetJarId?: string;
  targetJarName?: string;
  amount: number;
};

export type MonthClosePreview = {
  month: string;
  closeRunId: string;
  jarBalances: JarBalanceSummary[];
  overspendCoverage: OverspendCoverageItem[];
  rollovers: RolloverItem[];
  totalSurplus: number;
  totalDeficit: number;
};

export type MonthCloseResult = {
  closeRunId: string;
  snapshots: string[];
  movements: MovementResult[];
  events: EventResult[];
};

// ---------------------------------------------------------------------------
// Validation types
// ---------------------------------------------------------------------------
export type ValidationError = {
  code: string;
  message: string;
  field?: string;
};

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[] };

// ---------------------------------------------------------------------------
// Policy context
// ---------------------------------------------------------------------------
export type HouseholdPolicyContext = {
  overspendPolicy: OverspendPolicy;
  incomeAutoAllocate: IncomeAutoAllocateMode;
  expenseAutoAllocate: ExpenseAutoAllocateMode;
  monthCloseMode: MonthCloseMode;
};
