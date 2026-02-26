export type ScenarioActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialScenarioActionState: ScenarioActionState = {
  status: "idle",
  message: "",
};
