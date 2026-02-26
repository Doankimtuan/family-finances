export type AssetActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export const initialAssetActionState: AssetActionState = {
  status: "idle",
  message: "",
};
