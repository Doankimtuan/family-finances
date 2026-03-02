export type JarActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialJarActionState: JarActionState = {
  status: "idle",
  message: "",
};
