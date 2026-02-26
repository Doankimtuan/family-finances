export type OnboardingActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialOnboardingActionState: OnboardingActionState = {
  status: "idle",
  message: "",
};
