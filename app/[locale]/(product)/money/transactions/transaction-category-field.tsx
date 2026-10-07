"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type {
  CategoryTag,
  CaptureJarOption,
} from "@/modules/ledger/application/client";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import { FormField, formFieldA11y } from "@/shared/ui/form/form-field";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { categoryVisualFor, ACTION_ICONS } from "@/shared/ui/icon-registry";
import { SearchInput } from "@/shared/ui/search-input";
import { Sheet } from "@/shared/patterns/sheet";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { cn } from "@/shared/utils/cn";

type Props = {
  id: string;
  label: string;
  value: string | null | undefined;
  tags: CategoryTag[];
  jars: CaptureJarOption[];
  isDisabled?: boolean;
  isLoading?: boolean;
  onChange: (value: string | null) => void;
  onBlur: () => void;
};

export function TransactionCategoryField({
  id,
  label,
  value,
  tags,
  jars,
  isDisabled = false,
  isLoading = false,
  onChange,
  onBlur,
}: Props) {
  const t = useTranslations("money.captureForm");
  const tCatalog = useTranslations("catalog");
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = tags.find((tag) => tag.id === value);
  const jar = jars.find((candidate) => candidate.id === selected?.jarId);
  const description = jar
    ? localizeCatalogName(tCatalog, CatalogGroup.JARS, jar.name)
    : undefined;
  const name = (tag: CategoryTag) =>
    localizeCatalogName(tCatalog, CatalogGroup.TAGS, tag.name);
  let categoryLabel = t("tagNone");
  if (isLoading) {
    categoryLabel = t("referencesLoading");
  } else if (selected) {
    categoryLabel = name(selected);
  }
  const filtered = tags.filter((tag) =>
    name(tag).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const close = () => {
    setIsOpen(false);
    setQuery("");
    onBlur();
  };
  const select = (next: string | null) => {
    onChange(next);
    close();
  };

  return (
    <>
      <FormField id={id} label={label} description={description}>
        <Button
          {...formFieldA11y(id, false, Boolean(description))}
          type="button"
          variant={ButtonVariant.OUTLINED}
          isDisabled={isDisabled}
          aria-busy={isLoading || undefined}
          className="h-auto min-h-12 w-full justify-between bg-surface px-(--space-3) py-(--space-3) text-text-primary"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onPress={() => setIsOpen(true)}
          data-testid="capture-category"
        >
          <span className="flex min-w-0 items-center gap-(--space-3)">
            {!isLoading && selected ? (
              <IconContainer size="md">
                <AppIcon
                  icon={
                    categoryVisualFor({
                      categoryId: selected.id,
                      categoryName: selected.name,
                      iconKey: selected.iconKey,
                    }).icon
                  }
                  size="sm"
                />
              </IconContainer>
            ) : null}
            <span className="truncate">{categoryLabel}</span>
          </span>
          <AppIcon icon={ACTION_ICONS.forward} size="sm" />
        </Button>
      </FormField>
      <Sheet
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold text-text-primary">
              {label}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body className="flex flex-col gap-(--space-4)">
            <SearchInput
              value={query}
              onChange={setQuery}
              ariaLabel={t("categorySearch")}
              placeholder={t("categorySearch")}
            />
            <Button
              type="button"
              variant={ButtonVariant.OUTLINED}
              aria-pressed={!value}
              onPress={() => select(null)}
            >
              {t("tagNone")}
            </Button>
            <div className="grid grid-cols-4 gap-(--space-2)">
              {filtered.map((tag) => (
                <Button
                  key={tag.id}
                  type="button"
                  variant={ButtonVariant.GHOST}
                  aria-pressed={value === tag.id}
                  onPress={() => select(tag.id)}
                  className={cn(
                    "h-auto min-h-20 min-w-0 flex-col gap-(--space-2) whitespace-normal px-(--space-1) py-(--space-2) text-center text-xs",
                    value === tag.id &&
                      "bg-primary-soft text-primary ring-1 ring-primary/20",
                  )}
                >
                  <IconContainer size="md">
                    <AppIcon
                      icon={
                        categoryVisualFor({
                          categoryId: tag.id,
                          categoryName: tag.name,
                          iconKey: tag.iconKey,
                        }).icon
                      }
                      size="sm"
                    />
                  </IconContainer>
                  <span className="w-full wrap-break-word">{name(tag)}</span>
                </Button>
              ))}
            </div>
            {!filtered.length ? (
              <p className="text-sm text-text-secondary" role="status">
                {t("categoryEmpty")}
              </p>
            ) : null}
          </ActionSheetLayout.Body>
          <ActionSheetLayout.Footer>
            <Button
              type="button"
              variant={ButtonVariant.SECONDARY}
              className="w-full"
              onPress={close}
            >
              {t("categoryClose")}
            </Button>
          </ActionSheetLayout.Footer>
        </ActionSheetLayout>
      </Sheet>
    </>
  );
}
