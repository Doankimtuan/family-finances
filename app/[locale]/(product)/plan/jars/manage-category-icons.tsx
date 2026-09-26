"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { EditableCategory } from "@/modules/ledger/application";
import {
  CATEGORY_ICON_KEYS,
  DEFAULT_CATEGORY_ICON_KEY,
  type CategoryIconKey,
} from "@/modules/ledger/application/icon-constants";
import { CATEGORY_ICON_BY_KEY } from "@/shared/ui/stitch-icon-choices";
import { IconPickerField, SelectField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Sheet } from "@/shared/patterns/sheet";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { AlertVariant } from "@/shared/ui/alert";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import { updateCategoryIconAction } from "./actions";

export function ManageCategoryIcons({
  categories,
}: {
  categories: EditableCategory[];
}) {
  const t = useTranslations("plan.jars.categoryForm");
  const tIcons = useTranslations("common.iconPicker");
  const tCatalog = useTranslations("catalog");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const statusAlert = useStatusAlert();
  const categoryId = useId();
  const iconId = useId();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(categories[0]?.id ?? "");
  const selected = categories.find((category) => category.id === selectedId);
  const [iconKey, setIconKey] = useState<CategoryIconKey>(
    selected?.iconKey ?? DEFAULT_CATEGORY_ICON_KEY,
  );
  const [pending, startTransition] = useTransition();

  if (categories.length === 0) return null;

  function close() {
    setOpen(false);
    statusAlert.hide();
  }

  function openEditor() {
    const category =
      categories.find((item) => item.id === selectedId) ?? categories[0];
    if (!category) return;
    setSelectedId(category.id);
    setIconKey(category.iconKey ?? DEFAULT_CATEGORY_ICON_KEY);
    statusAlert.hide();
    setOpen(true);
  }

  function save() {
    if (!selected || !online) return;
    startTransition(async () => {
      const result = await updateCategoryIconAction({
        categoryId: selected.id,
        iconKey,
      });
      if (result.ok) {
        close();
        router.refresh();
      } else {
        statusAlert.show({
          variant: AlertVariant.DANGER,
          title: t("manageIcons"),
          description: t(`errors.${result.code}`),
        });
      }
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        className="w-full"
        isDisabled={!online}
        onPress={openEditor}
      >
        {t("manageIcons")}
      </Button>
      <Sheet isOpen={open} onOpenChange={(next) => !next && close()}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("manageIcons")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            {open ? (
              <div className="flex flex-col gap-(--space-3)">
                <SelectField
                  id={categoryId}
                  label={t("nameLabel")}
                  value={selectedId}
                  onChange={(id) => {
                    setSelectedId(id);
                    setIconKey(
                      categories.find((category) => category.id === id)
                        ?.iconKey ?? DEFAULT_CATEGORY_ICON_KEY,
                    );
                  }}
                  options={categories.map((category) => ({
                    id: category.id,
                    label: localizeCatalogName(
                      tCatalog,
                      CatalogGroup.TAGS,
                      category.name,
                    ),
                  }))}
                />
                <IconPickerField
                  id={iconId}
                  label={tIcons("label")}
                  value={iconKey}
                  onChange={setIconKey}
                  options={CATEGORY_ICON_KEYS.map((key) => ({
                    key,
                    label: tIcons(`choices.${key}`),
                    icon: CATEGORY_ICON_BY_KEY[key],
                  }))}
                  searchLabel={tIcons("search")}
                  emptyLabel={tIcons("empty")}
                />
              </div>
            ) : null}
          </ActionSheetLayout.Body>
          <SheetActionFooter
            secondaryLabel={t("cancel")}
            primaryLabel={t("saveIcon")}
            onSecondary={close}
            onPrimary={save}
            isDisabled={!online}
            isPrimaryDisabled={!selected}
            isPending={pending}
          />
        </ActionSheetLayout>
      </Sheet>
    </>
  );
}
