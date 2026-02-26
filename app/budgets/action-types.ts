export type BudgetActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialBudgetActionState: BudgetActionState = {
  status: "idle",
  message: "",
};
