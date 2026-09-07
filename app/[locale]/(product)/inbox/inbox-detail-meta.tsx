import type { ReactNode } from "react";
import { INBOX_TEST_ID } from "@/modules/inbox/application/inbox-constants";
import { Card } from "@/shared/patterns/card";

type InboxDetailMetaProps = {
  children: ReactNode;
};

/**
 * Source and queue-management rows. These are not money decisions.
 */
export function InboxDetailMeta({ children }: InboxDetailMetaProps) {
  return (
    <Card
      tone="elevated"
      className="gap-0 divide-y divide-border-subtle/65 overflow-hidden p-0"
      data-testid={INBOX_TEST_ID.DETAIL_META}
    >
      {children}
    </Card>
  );
}
