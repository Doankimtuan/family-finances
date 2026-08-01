export type GoalActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialGoalActionState: GoalActionState = {
  status: "idle",
  message: "",
};
