export type GoalRow = {
  id: string;
  name: string;
  goal_type: string;
  target_amount: number;
  target_date: string | null;
  start_date: string;
  priority: number;
  status: string;
};

export type ContributionRow = {
  id: string;
  goal_id: string;
  amount: number;
  contribution_date: string;
  flow_type: "inflow" | "outflow";
  source_account_id: string | null;
  destination_account_id: string | null;
  note: string | null;
};

export type AccountOption = {
  id: string;
  name: string;
};

export type PaceStatus = "on_track" | "behind" | "no_deadline" | "completed";

export type GoalStats = {
  funded: number;
  target: number;
  progressValue: number;
  remaining: number;
  monthlyWindow: number | null;
  requiredMonthly: number | null;
  avgMonthlyContribution: number;
  etaMonths: number | null;
  etaDate: Date | null;
  paceStatus: PaceStatus;
  overageMonths: number;
  neededExtraPerMonth: number;
};
