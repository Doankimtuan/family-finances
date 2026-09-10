"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import type {
  TransactionTag,
  TransactionTagColorKey,
  TransactionTagIconKey,
} from "@/modules/ledger/application/client";
import {
  DEFAULT_TRANSACTION_TAG_COLOR_KEY,
  DEFAULT_TRANSACTION_TAG_ICON_KEY,
  MAX_TRANSACTION_TAGS,
} from "@/modules/ledger/application/client";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { TextField } from "@/shared/ui/form";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { createTransactionTagAction } from "./tag-actions";
import { transactionTagVisualFor } from "./transaction-tag-visuals";
import { TransactionTagFormFields } from "./transaction-tag-form-fields";

export const TransactionTagSelectorLayout = {
  FIELD: "field",
  FILTER: "filter",
} as const;

export type TransactionTagSelectorLayout =
  (typeof TransactionTagSelectorLayout)[keyof typeof TransactionTagSelectorLayout];

const FILTER_TRIGGER_BASE_CLASS =
  "inline-flex min-h-11 max-w-full items-center justify-center gap-(--space-2) rounded-full px-(--space-3) text-sm font-medium leading-tight transition-[background-color,color,transform] duration-(--duration-fast) active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none";
const FILTER_TRIGGER_SELECTED_CLASS = `${FILTER_TRIGGER_BASE_CLASS} bg-primary-soft text-primary ring-1 ring-primary/20`;
const FILTER_TRIGGER_IDLE_CLASS = `${FILTER_TRIGGER_BASE_CLASS} bg-surface-muted/65 text-text-secondary hover:bg-surface-hover hover:text-text-primary`;
const FIELD_TRIGGER_CLASS =
  "flex min-h-11 w-full items-center justify-between gap-(--space-3) rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-3) text-left text-sm font-medium text-text-primary shadow-(--elevation-1) transition-[background-color,border-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none";

function selectorTriggerClassName(
  layout: TransactionTagSelectorLayout,
  selectedCount: number,
) {
  if (layout !== TransactionTagSelectorLayout.FILTER)
    return FIELD_TRIGGER_CLASS;
  return selectedCount > 0
    ? FILTER_TRIGGER_SELECTED_CLASS
    : FILTER_TRIGGER_IDLE_CLASS;
}

type TagSelectorProps = {
  availableTags: TransactionTag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onConfirm?: (ids: string[]) => void;
  disabled?: boolean;
  layout?: TransactionTagSelectorLayout;
};

export function TransactionTagChip({
  tag,
  onRemove,
}: {
  tag: TransactionTag;
  onRemove?: () => void;
}) {
  const t = useTranslations("money.transactionTags");
  const visual = transactionTagVisualFor(tag);

  return (
    <span
      className={`inline-flex min-h-11 max-w-full items-center gap-(--space-2) rounded-full border px-(--space-3) text-sm font-medium ${visual.color.surface} ${visual.color.border} ${visual.color.text}`}
      data-testid={`transaction-tag-chip-${tag.id}`}
    >
      <AppIcon icon={visual.icon} size="sm" emphasized />
      <span className="min-w-0 truncate text-pretty">{tag.name}</span>
      {tag.archivedAt ? (
        <span className="shrink-0 text-xs opacity-75">{t("archived")}</span>
      ) : null}
      {onRemove ? (
        <button
          type="button"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none"
          aria-label={t("remove", { name: tag.name })}
          onClick={onRemove}
        >
          <AppIcon icon={ACTION_ICONS.delete} size="xs" />
        </button>
      ) : null}
    </span>
  );
}

export function TransactionTagSelector({
  availableTags,
  selectedIds,
  onChange,
  onConfirm,
  disabled = false,
  layout = TransactionTagSelectorLayout.FIELD,
}: TagSelectorProps) {
  const t = useTranslations("money.transactionTags");
  const locale = useLocale();
  const [createdTags, setCreatedTags] = useState<TransactionTag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [iconKey, setIconKey] = useState<TransactionTagIconKey>(
    DEFAULT_TRANSACTION_TAG_ICON_KEY,
  );
  const [colorKey, setColorKey] = useState<TransactionTagColorKey>(
    DEFAULT_TRANSACTION_TAG_COLOR_KEY,
  );
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  const tags = useMemo(() => {
    const byId = new Map(availableTags.map((tag) => [tag.id, tag]));
    for (const tag of createdTags) byId.set(tag.id, tag);
    return [...byId.values()];
  }, [availableTags, createdTags]);
  const selectedTags = tags.filter((tag) => selectedIds.includes(tag.id));
  const activeTags = tags.filter((tag) => !tag.archivedAt);
  const archivedTags = tags.filter((tag) => tag.archivedAt);
  const visibleTags = tags
    .filter((tag) => !tag.archivedAt || selectedIds.includes(tag.id))
    .filter((tag) =>
      tag.name
        .toLocaleLowerCase(locale)
        .includes(query.trim().toLocaleLowerCase(locale)),
    );

  const toggle = (tag: TransactionTag) => {
    if (tag.archivedAt && !selectedIds.includes(tag.id)) return;
    if (selectedIds.includes(tag.id)) {
      onChange(selectedIds.filter((id) => id !== tag.id));
      return;
    }
    if (selectedIds.length >= MAX_TRANSACTION_TAGS) return;
    onChange([...selectedIds, tag.id]);
  };

  const resetCreate = () => {
    setName("");
    setIconKey(DEFAULT_TRANSACTION_TAG_ICON_KEY);
    setColorKey(DEFAULT_TRANSACTION_TAG_COLOR_KEY);
    setError(false);
  };

  const create = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setError(false);
    startTransition(async () => {
      const result = await createTransactionTagAction({
        name: trimmedName,
        iconKey,
        colorKey,
      });
      if (result.status === "error" || !result.tag) {
        setError(true);
        return;
      }
      setCreatedTags((current) => [...current, result.tag!]);
      onChange([...selectedIds, result.tag.id]);
      resetCreate();
      setIsCreating(false);
    });
  };

  const isFilterLayout = layout === TransactionTagSelectorLayout.FILTER;

  return (
    <div
      className={
        isFilterLayout
          ? "flex min-w-0 flex-col gap-(--space-2)"
          : "flex flex-col gap-(--space-4)"
      }
      data-testid="transaction-tag-selector"
    >
      {selectedTags.length > 0 ? (
        <div className="flex flex-wrap gap-(--space-2)">
          {selectedTags.map((tag) => (
            <TransactionTagChip
              key={tag.id}
              tag={tag}
              onRemove={() => toggle(tag)}
            />
          ))}
        </div>
      ) : null}
      {selectedTags.length === 0 && !isFilterLayout ? (
        <Text size="sm" tone="secondary">
          {t("noneSelected")}
        </Text>
      ) : null}

      <button
        type="button"
        className={selectorTriggerClassName(layout, selectedIds.length)}
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      >
        <span>{t("choose")}</span>
        <span
          className={isFilterLayout ? "tabular-nums" : "text-text-secondary"}
        >
          {selectedIds.length}/{MAX_TRANSACTION_TAGS}
        </span>
      </button>

      <Sheet
        isOpen={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setIsCreating(false);
            setQuery("");
            resetCreate();
          }
        }}
      >
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {isCreating ? t("createTitle") : t("chooseTitle")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body className="max-h-[min(68dvh,560px)]">
            {isCreating ? (
              <div className="flex flex-col gap-(--space-4)">
                <TransactionTagFormFields
                  name={name}
                  onNameChange={setName}
                  iconKey={iconKey}
                  onIconChange={setIconKey}
                  colorKey={colorKey}
                  onColorChange={setColorKey}
                />
                {error ? (
                  <Text size="sm" className="text-danger">
                    {t("saveError")}
                  </Text>
                ) : null}
              </div>
            ) : activeTags.length === 0 ? (
              <div className="flex flex-col gap-(--space-4)">
                <div>
                  <Text size="sm" weight="medium">
                    {archivedTags.length > 0
                      ? t("noActiveTitle")
                      : t("noTagsTitle")}
                  </Text>
                  <Text size="sm" tone="secondary" className="mt-1 text-pretty">
                    {archivedTags.length > 0
                      ? t("noActiveDescription")
                      : t("noTagsDescription")}
                  </Text>
                </div>
                <div className="flex flex-wrap gap-(--space-2)">
                  <Button
                    variant="secondary"
                    onPress={() => setIsCreating(true)}
                  >
                    {t("create")}
                  </Button>
                  {archivedTags.length > 0 ? (
                    <Link
                      href={APP_PATH.MONEY_TRANSACTION_TAGS}
                      className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-(--space-3) text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    >
                      {t("manageTags")}
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-(--space-4)">
                <TextField
                  id="transaction-tag-search"
                  label={t("searchLabel")}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <div className="flex flex-col gap-(--space-2)">
                  {visibleTags.map((tag) => {
                    const selected = selectedIds.includes(tag.id);
                    const visual = transactionTagVisualFor(tag);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        aria-pressed={selected}
                        disabled={Boolean(tag.archivedAt) && !selected}
                        className={`flex min-h-11 items-center gap-(--space-3) rounded-[var(--radius-control)] border px-(--space-3) text-left transition-[background-color,border-color,transform,opacity] duration-(--duration-fast) active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none ${selected ? `${visual.color.surface} ${visual.color.border}` : "border-border-subtle bg-surface hover:bg-surface-hover"} ${tag.archivedAt && !selected ? "cursor-not-allowed opacity-45" : ""}`}
                        onClick={() => toggle(tag)}
                      >
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] ${visual.color.surface} ${visual.color.text}`}
                        >
                          <AppIcon icon={visual.icon} size="sm" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                          {tag.name}
                        </span>
                        {tag.archivedAt ? (
                          <span className="text-xs text-text-secondary">
                            {t("archived")}
                          </span>
                        ) : null}
                        <span
                          aria-hidden
                          className={`flex size-5 items-center justify-center rounded-full border text-xs ${selected ? "border-accent bg-accent text-accent-fg" : "border-border-strong"}`}
                        >
                          {selected ? (
                            <AppIcon icon={ACTION_ICONS.check} size="xs" />
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                  {visibleTags.length === 0 ? (
                    <Text size="sm" tone="secondary">
                      {t("empty")}
                    </Text>
                  ) : null}
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onPress={() => setIsCreating(true)}
                >
                  {t("create")}
                </Button>
              </div>
            )}
          </ActionSheetLayout.Body>
          <ActionSheetLayout.Footer>
            {isCreating ? (
              <>
                <Button
                  variant="secondary"
                  fullWidth
                  className="min-w-0 flex-1"
                  isDisabled={isPending}
                  onPress={() => {
                    resetCreate();
                    setIsCreating(false);
                  }}
                >
                  {t("cancel")}
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  className="min-w-0 flex-1"
                  isDisabled={isPending || !name.trim()}
                  isPending={isPending}
                  onPress={create}
                >
                  {t("save")}
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                fullWidth
                onPress={() => {
                  setIsOpen(false);
                  onConfirm?.(selectedIds);
                }}
              >
                {t("done")}
              </Button>
            )}
          </ActionSheetLayout.Footer>
        </ActionSheetLayout>
      </Sheet>
    </div>
  );
}

export function TagIconPreview({
  tag,
}: {
  tag: Pick<TransactionTag, "iconKey" | "colorKey">;
}) {
  const visual = transactionTagVisualFor(tag);
  return (
    <span
      className={`flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] ${visual.color.surface} ${visual.color.text}`}
    >
      <AppIcon icon={visual.icon} size="md" emphasized />
    </span>
  );
}
