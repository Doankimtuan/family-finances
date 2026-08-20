"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type {
  TransactionTag,
  TransactionTagIconKey,
} from "@/modules/ledger/application/client";
import {
  DEFAULT_TRANSACTION_TAG_COLOR_KEY,
  DEFAULT_TRANSACTION_TAG_ICON_KEY,
  TransactionTagColorKey,
} from "@/modules/ledger/application/client";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Dialog, DialogContent } from "@/shared/patterns/dialog";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { EmptyState } from "@/shared/patterns/empty-state";
import {
  archiveTransactionTagAction,
  createTransactionTagAction,
  updateTransactionTagAction,
} from "./tag-actions";
import { TagIconPreview } from "./transaction-tag-ui";
import { TransactionTagFormFields } from "./transaction-tag-form-fields";
import { transactionTagVisualFor } from "./transaction-tag-visuals";

export function TransactionTagManagement({
  initialTags,
}: {
  initialTags: TransactionTag[];
}) {
  const t = useTranslations("money.transactionTags");
  const [tags, setTags] = useState(initialTags);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionTag | null>(null);
  const [confirming, setConfirming] = useState<TransactionTag | null>(null);
  const [name, setName] = useState("");
  const [iconKey, setIconKey] = useState<TransactionTagIconKey>(
    DEFAULT_TRANSACTION_TAG_ICON_KEY,
  );
  const [colorKey, setColorKey] = useState<TransactionTagColorKey>(
    DEFAULT_TRANSACTION_TAG_COLOR_KEY,
  );
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeTags = useMemo(
    () => tags.filter((tag) => !tag.archivedAt),
    [tags],
  );
  const archivedTags = useMemo(
    () => tags.filter((tag) => tag.archivedAt),
    [tags],
  );

  const resetForm = () => {
    setName("");
    setIconKey(DEFAULT_TRANSACTION_TAG_ICON_KEY);
    setColorKey(DEFAULT_TRANSACTION_TAG_COLOR_KEY);
    setError(false);
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (tag: TransactionTag) => {
    setEditing(tag);
    setName(tag.name);
    setIconKey(tag.iconKey);
    setColorKey(tag.colorKey ?? DEFAULT_TRANSACTION_TAG_COLOR_KEY);
    setError(false);
    setIsFormOpen(true);
  };

  const save = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setError(false);
    startTransition(async () => {
      const input = { name: trimmedName, iconKey, colorKey };
      const result = editing
        ? await updateTransactionTagAction(editing.id, input)
        : await createTransactionTagAction(input);
      if (result.status === "error" || !result.tag) {
        setError(true);
        return;
      }
      setTags((current) =>
        editing
          ? current.map((tag) =>
              tag.id === result.tag!.id ? result.tag! : tag,
            )
          : [...current, result.tag!],
      );
      setIsFormOpen(false);
      resetForm();
    });
  };

  const archive = () => {
    if (!confirming) return;
    startTransition(async () => {
      const result = await archiveTransactionTagAction(confirming.id);
      if (result.status === "error") {
        setError(true);
        return;
      }
      setTags((current) =>
        current.map((tag) =>
          tag.id === confirming.id
            ? { ...tag, archivedAt: new Date().toISOString() }
            : tag,
        ),
      );
      setConfirming(null);
    });
  };

  const renderRow = (tag: TransactionTag) => {
    const visual = transactionTagVisualFor(tag);
    return (
      <li
        key={tag.id}
        className="flex items-center gap-(--space-2) rounded-lg border border-border-subtle bg-surface p-(--space-3)"
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-(--space-3) rounded-md text-left transition-[background-color,transform] duration-(--duration-fast) active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
          onClick={() => openEdit(tag)}
        >
          <TagIconPreview tag={tag} />
          <span className="min-w-0 flex-1">
            <Text
              size="sm"
              weight="medium"
              className="truncate text-text-primary"
            >
              {tag.name}
            </Text>
            <Text
              size="sm"
              tone="secondary"
              className="mt-1 truncate text-pretty"
            >
              {tag.archivedAt
                ? t("archived")
                : t(`colors.${tag.colorKey ?? TransactionTagColorKey.SLATE}`)}
            </Text>
          </span>
          <span
            className={`size-4 shrink-0 rounded-full ${visual.color.swatch}`}
            aria-hidden
          />
        </button>
        {!tag.archivedAt ? (
          <IconButton
            aria-label={t("archiveAction", { name: tag.name })}
            variant="ghost"
            onPress={() => {
              setError(false);
              setConfirming(tag);
            }}
          >
            <AppIcon icon={ACTION_ICONS.more} size="sm" />
          </IconButton>
        ) : null}
      </li>
    );
  };

  return (
    <div
      className="flex flex-col gap-(--space-6)"
      data-testid="transaction-tag-management"
    >
      <div className="flex items-start gap-(--space-3)">
        <div className="min-w-0 flex-1">
          <Text size="sm" tone="secondary" className="text-pretty">
            {t("managementHint")}
          </Text>
        </div>
        <Button variant="primary" className="shrink-0" onPress={openCreate}>
          {t("create")}
        </Button>
      </div>
      {error ? <StatusAlert variant="danger" title={t("saveError")} /> : null}
      {activeTags.length > 0 ? (
        <section className="flex flex-col gap-(--space-3)">
          <h2 className="text-base font-semibold text-text-primary">
            {t("activeTitle")}
          </h2>
          <ul className="flex flex-col gap-(--space-2)">
            {activeTags.map(renderRow)}
          </ul>
        </section>
      ) : (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      )}
      {archivedTags.length > 0 ? (
        <section className="flex flex-col gap-(--space-3)">
          <h2 className="text-base font-semibold text-text-primary">
            {t("archivedTitle")}
          </h2>
          <ul className="flex flex-col gap-(--space-2)">
            {archivedTags.map(renderRow)}
          </ul>
        </section>
      ) : null}

      <Sheet isOpen={isFormOpen} onOpenChange={setIsFormOpen}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {editing ? t("editTitle") : t("createTitle")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body className="max-h-[min(70dvh,600px)]">
            <TransactionTagFormFields
              name={name}
              onNameChange={setName}
              iconKey={iconKey}
              onIconChange={setIconKey}
              colorKey={colorKey}
              onColorChange={setColorKey}
            />
          </ActionSheetLayout.Body>
          <ActionSheetLayout.Footer>
            <Button
              variant="secondary"
              fullWidth
              className="min-w-0 flex-1"
              isDisabled={isPending}
              onPress={() => setIsFormOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              fullWidth
              className="min-w-0 flex-1"
              isDisabled={isPending || !name.trim()}
              isPending={isPending}
              onPress={save}
            >
              {t("save")}
            </Button>
          </ActionSheetLayout.Footer>
        </ActionSheetLayout>
      </Sheet>

      <Dialog
        isOpen={Boolean(confirming)}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
      >
        <DialogContent>
          <Dialog.Header className="px-(--space-4) pt-(--space-4)">
            <Dialog.Heading className="text-lg font-semibold text-text-primary">
              {t("archiveTitle")}
            </Dialog.Heading>
          </Dialog.Header>
          <Dialog.Body className="px-(--space-4) py-(--space-3)">
            <Text size="sm" tone="secondary" className="text-pretty">
              {t("archiveBody", { name: confirming?.name ?? "" })}
            </Text>
          </Dialog.Body>
          <Dialog.Footer className="flex gap-(--space-2) px-(--space-4) pb-(--space-4)">
            <Button
              variant="secondary"
              fullWidth
              className="min-w-0 flex-1"
              isDisabled={isPending}
              onPress={() => setConfirming(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              fullWidth
              className="min-w-0 flex-1"
              isDisabled={isPending}
              isPending={isPending}
              onPress={archive}
            >
              {t("archive")}
            </Button>
          </Dialog.Footer>
        </DialogContent>
      </Dialog>
    </div>
  );
}
