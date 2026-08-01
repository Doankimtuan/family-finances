export type SettingsActionState = {
  status: "idle" | "error" | "success" | "pending";
  message: string;
};

export const initialSettingsActionState: SettingsActionState = {
  status: "idle",
  message: "",
};
