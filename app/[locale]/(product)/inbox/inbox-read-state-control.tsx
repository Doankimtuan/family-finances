"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { Button } from "@/shared/ui/button";
import { markInboxReadAction, markInboxUnreadAction } from "./actions";

export function InboxReadStateControl({ item }: { item: InboxReviewItem }) {
  const t = useTranslations("inbox");
  const router = useRouter();
  const [readAt, setReadAt] = useState(item.readAt);
  const [busy, setBusy] = useState(false);

  return (
    <Button
      variant="secondary"
      className="w-full"
      isDisabled={busy}
      data-testid="inbox-read-state"
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
