import {
  InboxItemKind,
  InboxItemStatus,
  InboxSourceType,
} from "@/modules/inbox/application/inbox-constants";
import type { InboxItemRow } from "@/modules/inbox/application/mappers/inbox-item.mapper";

const FIXTURE_PREFIX = "180c0000-0000-4000-8000-";

export function inbox18cRows(count = 75): InboxItemRow[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${FIXTURE_PREFIX}${String(index + 1).padStart(12, "0")}`,
    kind:
      index % 5 === 0
        ? InboxItemKind.SAVINGS_MATURITY
        : InboxItemKind.LOAN_PAYMENT_ATTENTION,
    status: InboxItemStatus.PENDING,
    title: `18C fixture ${index + 1}`,
    amount: 1000 + index,
    currency: "VND",
    source_id: `${FIXTURE_PREFIX}${String(index + 100).padStart(12, "0")}`,
    source_type: InboxSourceType.GUIDED,
    created_at: `2026-08-24T${String(23 - Math.floor(index / 3)).padStart(2, "0")}:${String(index % 3).padStart(2, "0")}:00Z`,
    expires_at: null,
    read_at: index % 2 === 0 ? null : "2026-08-24T01:00:00Z",
    context_json:
      index % 5 === 0
        ? {
            savingId: `${FIXTURE_PREFIX}${String(index + 100).padStart(12, "0")}`,
            maturityDate: "2026-08-24",
          }
        : {
            loanId: `${FIXTURE_PREFIX}${String(index + 100).padStart(12, "0")}`,
            dueDate: "2026-08-27",
          },
  }));
}
