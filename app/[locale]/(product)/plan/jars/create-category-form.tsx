"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  TRANSACTION_DIRECTION_OPTIONS,
  TransactionDirection,
  type CaptureJarOption,
  type TransactionDirection as TransactionDirectionValue,
} from "@/modules/ledger/application/client";
import { SelectField, TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Sheet } from "@/shared/patterns/sheet";
import { ChoiceTile, ChoiceTileGroup } from "@/shared/patterns/choice-tile";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { useStatusAlert } from "@/providers/status-alert-provider";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { createCategoryAction } from "./actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type Props = {
  jars: CaptureJarOption[];
};

function createCategoryDefaults() {
  return {
    name: "",
    kind: TransactionDirection.EXPENSE,
    mappedJarId: "",
  };
}

/** Category creation keeps jar mapping optional for both category kinds. */
export function CreateCategoryForm({ jars }: Props) {
  const t = useTranslations("plan.jars.categoryForm");
  const tCatalog = useTranslations("catalog");
  const router = useRouter();
  const nameId = useId();
  const jarId = useId();
  const { online } = useOnlineStatusClient();
  const statusAlert = useStatusAlert();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<TransactionDirectionValue>(
    TransactionDirection.EXPENSE,
  );
  const [mappedJarId, setMappedJarId] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    const defaults = createCategoryDefaults();
    setName(defaults.name);
    setKind(defaults.kind);
    setMappedJarId(defaults.mappedJarId);
    setNameError(null);
  };

  const close = () => {
    statusAlert.hide();
    reset();
    setOpen(false);
  };

  const showCreateError = (code: ErrorCode) => {
    statusAlert.show({
      variant: AlertVariant.DANGER,
      title: t("open"),
      description: t(`errors.${code}`),
    });
  };

  const handleKindChange = (nextKind: TransactionDirectionValue) => {
    setKind(nextKind);
  };

  const onSubmit = () => {
    statusAlert.hide();
    setNameError(null);
    if (!online) {
      showCreateError(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (!name.trim()) {
      setNameError(t(`errors.${PRODUCT_ACTION_ERROR_CODE.INVALID}`));
      return;
    }

    const trimmedName = name.trim();
    const categoryInput = {
      name: trimmedName,
      kind,
      jarId: mappedJarId || null,
    };

    startTransition(async () => {
      const result = await createCategoryAction(categoryInput);
      if (result.status === "success") {
        close();
        router.refresh();
        return;
      }
      if (
        result.code === PRODUCT_ACTION_ERROR_CODE.INVALID ||
        result.code === PRODUCT_ACTION_ERROR_CODE.UNAUTHENTICATED ||
        result.code === PRODUCT_ACTION_ERROR_CODE.NO_MEMBERSHIP ||
        result.code === PRODUCT_ACTION_ERROR_CODE.MONTH_LOCKED ||
        result.code === PRODUCT_ACTION_ERROR_CODE.UNKNOWN
      ) {
        showCreateError(result.code);
        return;
      }
      showCreateError(PRODUCT_ACTION_ERROR_CODE.UNKNOWN);
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        className="w-full"
        data-testid="category-create-open"
        isDisabled={!online}
        onPress={() => {
          if (!online) return;
          statusAlert.hide();
          setOpen(true);
        }}
      >
        {online ? t("open") : t("errors.offline")}
      </Button>
      <Sheet isOpen={open} onOpenChange={(next) => !next && close()}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("open")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            {open ? (
              <div
                className="flex flex-col gap-(--space-3)"
                data-testid="category-create-form"
              >
                <TextField
                  id={nameId}
                  label={t("nameLabel")}
                  placeholder={t("namePlaceholder")}
                  value={name}
                  error={nameError ?? undefined}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                />
                <fieldset className="flex flex-col gap-(--space-2)">
                  <legend className="text-sm font-medium text-text-primary">
                    {t("kindLabel")}
                  </legend>
                  <ChoiceTileGroup>
                    {TRANSACTION_DIRECTION_OPTIONS.map((option) => (
                      <ChoiceTile
                        key={option}
                        label={t(`kinds.${option}`)}
                        selected={kind === option}
                        onPress={() => handleKindChange(option)}
                        role="radio"
                        testId={`category-kind-${option}`}
                      />
                    ))}
                  </ChoiceTileGroup>
                </fieldset>
                <SelectField
                  id={jarId}
                  label={t("jarLabel")}
                  value={mappedJarId}
                  placeholder={t("jarOptional")}
                  data-testid="category-jar-select"
                  onChange={setMappedJarId}
                  options={jars.map((jar) => ({
                    id: jar.id,
                    label:
                      localizeCatalogName(
                        tCatalog,
                        CatalogGroup.JARS,
                        jar.name,
                      ) || jar.name,
                  }))}
                />
              </div>
            ) : null}
          </ActionSheetLayout.Body>
          <SheetActionFooter
            secondaryLabel={t("cancel")}
            primaryLabel={t("submit")}
            onSecondary={close}
            onPrimary={onSubmit}
            primaryTestId="category-create-submit"
            isDisabled={!online}
            isPrimaryDisabled={!name.trim()}
            isPending={isPending}
          />
        </ActionSheetLayout>
      </Sheet>
    </>
  );
}
