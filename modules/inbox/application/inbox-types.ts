import type {
  InboxItemKind,
  InboxItemStatus,
  ReviewItemType,
} from "./inbox-constants";
import type { TypedReviewItem } from "./review-item-schemas";

export type InboxReviewItem = {
  id: string;
  kind: InboxItemKind;
  /** Spec ReviewItemType when kind maps to the v2.1 taxonomy (AC-INB-01). */
  type: ReviewItemType | null;
  status: InboxItemStatus;
  /** Raw stored title (may be a generic fallback). */
  title: string;
  /** User-facing title: note → category → stored title. */
  displayTitle: string;
  amount: number;
  currency: string;
  sourceId: string;
  createdAt: string;
  expiresAt: string | null;
  autoResolved: boolean;
  confidenceScore: number | null;
  suggestedJarId: string | null;
  suggestedCategoryId: string | null;
  /** Linked transaction note when source is a ledger tx. */
  note: string | null;
  /** Linked category name (e.g. Food). */
  categoryName: string | null;
  /** Linked account name (e.g. Visa TPBank). */
  accountName: string | null;
  /** Typed payload discriminator instance when constructible. */
  typed: TypedReviewItem | null;
  /** Emergency intent note when kind is emergency_declaration (BR-13). */
  intentNote: string | null;
  /** Declarer user id from emergency context (BR-13). */
  executedByUserId: string | null;
  /** Partner assignee for targeted emergency alerts (BR-13). */
  assignedToUserId: string | null;
};
