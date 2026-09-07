"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { INBOX_TEST_ID } from "@/modules/inbox/application/inbox-constants";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { cn } from "@/shared/utils/cn";
import { markInboxReadAction, markInboxUnreadAction } from "./actions";
import { INBOX_META_ROW_CLASS } from "./inbox-chrome";

export function InboxReadStateControl({ item }: { item: InboxReviewItem }) {
  const t = useTranslations("inbox");
  const router = useRouter();
  const [readAt, setReadAt] = useState(item.readAt);
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant={ButtonVariant.GHOST}
      className={cn(INBOX_META_ROW_CLASS, "rounded-none shadow-none")}
      isDisabled={busy}
      data-testid={INBOX_TEST_ID.READ_STATE}
      onPress={async () => {
        setBusy(true);
        const result = readAt
          ? await markInboxUnreadAction(item.id)
          : await markInboxReadAction(item.id);
        if (result.status === "success") {
          setReadAt(readAt ? null : new Date().toISOString());
          router.refresh();
        }
        setBusy(false);
      }}
    >
      {readAt ? t("markUnread") : t("markRead")}
    </Button>
  );
}
