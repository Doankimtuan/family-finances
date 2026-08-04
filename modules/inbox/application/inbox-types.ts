import type { InboxItemKind } from "./inbox-constants";

export type InboxReviewItem = {
  id: string;
  kind: InboxItemKind;
  title: string;
  amount: number;
  currency: string;
  sourceId: string;
  createdAt: string;
  /** Emergency intent note when kind is emergency_declaration (BR-13). */
  intentNote: string | null;
  /** Declarer user id from emergency context (BR-13). */
  executedByUserId: string | null;
  /** Partner assignee for targeted emergency alerts (BR-13). */
  assignedToUserId: string | null;
};
