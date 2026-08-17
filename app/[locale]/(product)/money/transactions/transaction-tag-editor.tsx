"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { TransactionTag } from "@/modules/ledger/application/client";
import { Button } from "@/shared/ui/button";
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
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState(() =>
    initialTags.map((tag) => tag.id),
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const statusAlert = useStatusAlert();

  const initialIds = useMemo(
    () =>
      initialTags
        .map((tag) => tag.id)
        .sort()
        .join(","),
    [initialTags],
  );
  const isDirty = [...selectedIds].sort().join(",") !== initialIds;

  const save = () => {
    statusAlert.hide();
    setSaved(false);
    startTransition(async () => {
      const result = await setTransactionTagsAction(transactionId, selectedIds);
      if (result.status === "error") {
        statusAlert.show({
          variant: AlertVariant.DANGER,
          title: t("tagSaveError"),
        });
        return;
      }
      setSaved(true);
      router.refresh();
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
        disabled={isPending}
      />
      {saved ? (
        <Text size="sm" className="text-success" aria-live="polite">
          {t("tagSaved")}
        </Text>
      ) : null}
      <Button
        variant="primary"
        className="w-full"
        isDisabled={isPending || !isDirty}
        isPending={isPending}
        onPress={save}
      >
        {t("saveTags")}
      </Button>
    </section>
  );
}
