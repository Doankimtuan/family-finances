export type HouseholdActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialHouseholdActionState: HouseholdActionState = {
  status: "idle",
  message: "",
};
