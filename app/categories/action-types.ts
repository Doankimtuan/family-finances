export type CategoryActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialCategoryActionState: CategoryActionState = {
  status: "idle",
  message: "",
};
