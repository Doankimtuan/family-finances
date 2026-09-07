"use client";

import type {
  TransactionTagColorKey,
  TransactionTagIconKey,
} from "@/modules/ledger/application/client";
import {
  TRANSACTION_TAG_COLOR_KEYS,
  TRANSACTION_TAG_ICON_KEYS,
} from "@/modules/ledger/application/client";
import { AppIcon } from "@/shared/ui/app-icon";
import { Text } from "@/shared/ui/text";
import { TextField } from "@/shared/ui/form";
import { cn } from "@/shared/utils/cn";
import { useTranslations } from "next-intl";
import { TagIconPreview } from "./transaction-tag-ui";
import {
  TRANSACTION_TAG_COLORS,
  TRANSACTION_TAG_ICONS,
} from "./transaction-tag-visuals";

type Props = {
  name: string;
  onNameChange: (value: string) => void;
  iconKey: TransactionTagIconKey;
  onIconChange: (value: TransactionTagIconKey) => void;
  colorKey: TransactionTagColorKey;
  onColorChange: (value: TransactionTagColorKey) => void;
};

const OPTION_BASE_CLASS =
  "flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border transition-[background-color,border-color,transform,box-shadow] duration-(--duration-fast) active:scale-[var(--press-scale)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none";

export function TransactionTagFormFields({
  name,
  onNameChange,
  iconKey,
  onIconChange,
  colorKey,
  onColorChange,
}: Props) {
  const t = useTranslations("money.transactionTags");
  const previewName = name.trim() || t("nameLabel");

  return (
    <div className="flex flex-col gap-(--space-4)">
      <div className="flex items-center gap-(--space-3) rounded-[var(--radius-card)] border border-border-subtle bg-surface px-(--space-4) py-(--space-3) shadow-(--elevation-1)">
        <TagIconPreview tag={{ iconKey, colorKey }} />
        <Text
          size="sm"
          weight="medium"
          className="min-w-0 truncate text-pretty text-text-primary"
        >
          {previewName}
        </Text>
      </div>
      <TextField
        id="transaction-tag-name"
        label={t("nameLabel")}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
      />
      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("iconLabel")}
        </legend>
        <div className="grid grid-cols-4 gap-(--space-2)">
          {TRANSACTION_TAG_ICON_KEYS.map((key) => {
            const selected = iconKey === key;
            return (
              <button
                key={key}
                type="button"
                aria-label={t(`icons.${key}`)}
                aria-pressed={selected}
                className={cn(
                  OPTION_BASE_CLASS,
                  selected
                    ? "border-accent bg-primary-soft text-primary"
                    : "border-border-subtle bg-surface text-text-secondary hover:bg-surface-hover",
                )}
                onClick={() => onIconChange(key)}
              >
                <AppIcon icon={TRANSACTION_TAG_ICONS[key]} size="md" />
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("colorLabel")}
        </legend>
        <div className="grid grid-cols-6 gap-(--space-2)">
          {TRANSACTION_TAG_COLOR_KEYS.map((key) => {
            const color = TRANSACTION_TAG_COLORS[key];
            const selected = colorKey === key;
            return (
              <button
                key={key}
                type="button"
                aria-label={t(`colors.${key}`)}
                aria-pressed={selected}
                className={cn(
                  OPTION_BASE_CLASS,
                  color.border,
                  color.surface,
                  selected &&
                    "ring-2 ring-focus-ring ring-offset-2 ring-offset-surface-elevated",
                )}
                onClick={() => onColorChange(key)}
              >
                <span className={`size-5 rounded-full ${color.swatch}`} />
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
