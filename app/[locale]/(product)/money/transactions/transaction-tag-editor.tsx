"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { TransactionTag } from "@/modules/ledger/application/client";
import { Text } from "@/shared/ui/text";
import { AlertVariant } from "@/shared/ui/alert";
import { setTransactionTagsAction } from "./tag-actions";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { TransactionTagSelector } from "./transaction-tag-ui";

type Props = {
  transactionId: string;
  initialTags: TransactionTag[];
  availableTags: TransactionTag[];
};

export function TransactionTagEditor({
  transactionId,
  initialTags,
  availableTags,
}: Props) {
  const t = useTranslations("money.detailPage");
  const [selectedIds, setSelectedIds] = useState(() =>
    initialTags.map((tag) => tag.id),
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const statusAlert = useStatusAlert();

  const save = (nextIds: string[]) => {
    statusAlert.hide();
    setSaved(false);
    startTransition(async () => {
      const result = await setTransactionTagsAction(transactionId, nextIds);
      if (result.status === "error") {
        statusAlert.show({
          variant: AlertVariant.DANGER,
          title: t("tagSaveError"),
        });
        return;
      }
      setSaved(true);
    });
  };

  return (
    <section
      className="flex flex-col gap-(--space-3)"
      data-testid="transaction-tags"
    >
      <div>
        <Text size="sm" weight="medium">
          {t("tags")}
        </Text>
        <Text size="sm" tone="secondary" className="mt-1 text-pretty">
          {t("tagHint")}
        </Text>
      </div>
      <TransactionTagSelector
        availableTags={availableTags}
        selectedIds={selectedIds}
        onChange={(ids) => {
          setSelectedIds(ids);
          setSaved(false);
        }}
        onConfirm={save}
        disabled={isPending}
      />
      {saved ? (
        <Text size="sm" className="text-success" aria-live="polite">
          {t("tagSaved")}
        </Text>
      ) : null}
    </section>
  );
}
