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
import { TextField } from "@/shared/ui/form";
import { useTranslations } from "next-intl";
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

export function TransactionTagFormFields({
  name,
  onNameChange,
  iconKey,
  onIconChange,
  colorKey,
  onColorChange,
}: Props) {
  const t = useTranslations("money.transactionTags");
  return (
    <div className="flex flex-col gap-(--space-4)">
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
          {TRANSACTION_TAG_ICON_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              aria-label={t(`icons.${key}`)}
              aria-pressed={iconKey === key}
              className={`flex min-h-11 items-center justify-center rounded-md border transition-[background-color,border-color,transform] duration-(--duration-fast) active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none ${iconKey === key ? "border-accent bg-primary-soft text-primary" : "border-border-subtle bg-surface text-text-secondary hover:bg-surface-hover"}`}
              onClick={() => onIconChange(key)}
            >
              <AppIcon icon={TRANSACTION_TAG_ICONS[key]} size="md" />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("colorLabel")}
        </legend>
        <div className="grid grid-cols-6 gap-(--space-2)">
          {TRANSACTION_TAG_COLOR_KEYS.map((key) => {
            const color = TRANSACTION_TAG_COLORS[key];
            return (
              <button
                key={key}
                type="button"
                aria-label={t(`colors.${key}`)}
                aria-pressed={colorKey === key}
                className={`flex min-h-11 items-center justify-center rounded-md border ${color.border} ${color.surface} transition-[transform,box-shadow] duration-(--duration-fast) active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring motion-reduce:transition-none ${colorKey === key ? "ring-2 ring-focus-ring ring-offset-2 ring-offset-surface-elevated" : ""}`}
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
