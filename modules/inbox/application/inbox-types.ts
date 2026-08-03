import type { InboxItemKind } from "./inbox-constants";

export type InboxReviewItem = {
  id: string;
  kind: InboxItemKind;
  title: string;
  amount: number;
  currency: string;
  sourceId: string;
  createdAt: string;
};
