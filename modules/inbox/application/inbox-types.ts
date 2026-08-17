import type {
  InboxItemKind,
  InboxItemStatus,
  InboxSourceType,
} from "./inbox-constants";
import type { TypedReviewItem } from "./review-item-schemas";

export type InboxReviewItem = {
  id: string;
  /** Canonical type discriminator; null only for legacy unsupported kinds. */
  kind: InboxItemKind | null;
  status: InboxItemStatus;
  /** Raw stored title (may be a generic fallback). */
  title: string;
  /** User-facing title: note → category → stored title. */
  displayTitle: string;
  amount: number;
  currency: string;
  sourceId: string;
  /** Owning-domain source discriminator when known. */
  sourceType: InboxSourceType | null;
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
  /** Typed payload instance when the kind is canonical and constructible. */
  typed: TypedReviewItem | null;
  /** Emergency intent note when kind is emergency_declaration (BR-13). */
  intentNote: string | null;
  /** Declarer user id from emergency context (BR-13). */
  executedByUserId: string | null;
  /** Partner assignee for targeted emergency alerts (BR-13). */
  assignedToUserId: string | null;
};

export type InboxCanonicalReviewItem = InboxReviewItem & {
  kind: InboxItemKind;
  typed: TypedReviewItem;
};
