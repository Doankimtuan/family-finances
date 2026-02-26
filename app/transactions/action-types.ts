export type TransactionActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialTransactionActionState: TransactionActionState = {
  status: "idle",
  message: "",
};
