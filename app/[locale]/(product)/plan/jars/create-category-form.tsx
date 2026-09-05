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
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { LEDGER_ACTION_ERROR_CODE } from "@/modules/ledger/application/client";
import { createCategoryAction } from "./actions";

type ErrorCode =
  | ProductActionErrorCode
  | typeof LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED
  | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type Props = {
  jars: CaptureJarOption[];
};

/** Category creation keeps Jar mapping only for expense categories. */
export function CreateCategoryForm({ jars }: Props) {
  const t = useTranslations("plan.jars.categoryForm");
  const tCatalog = useTranslations("catalog");
  const router = useRouter();
  const nameId = useId();
  const kindId = useId();
  const jarId = useId();
  const { online } = useOnlineStatusClient();
  const statusAlert = useStatusAlert();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<TransactionDirectionValue>(
    TransactionDirection.EXPENSE,
  );
  const [mappedJarId, setMappedJarId] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
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
    );
  }

  const showCreateError = (code: ErrorCode) => {
    statusAlert.show({
      variant: AlertVariant.DANGER,
      title: t("open"),
      description: t(`errors.${code}`),
    });
  };

  const onSubmit = () => {
    statusAlert.hide();
    if (!online) {
      showCreateError(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (kind === TransactionDirection.EXPENSE && !mappedJarId) {
      showCreateError(LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED);
      return;
    }
    if (!name.trim()) {
      showCreateError(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }

    const categoryInput =
      kind === TransactionDirection.EXPENSE
        ? {
            name: name.trim(),
            kind: TransactionDirection.EXPENSE,
            jarId: mappedJarId,
          }
        : {
            name: name.trim(),
            kind: TransactionDirection.INCOME,
            jarId: null,
          };

    startTransition(async () => {
      const result = await createCategoryAction(categoryInput);
      if (result.status === "success") {
        setOpen(false);
        setName("");
        setMappedJarId("");
        router.refresh();
        return;
      }
      if (
        result.code === LEDGER_ACTION_ERROR_CODE.CATEGORY_UNMAPPED ||
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
    <div
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
      data-testid="category-create-form"
    >
      <TextField
        id={nameId}
        label={t("nameLabel")}
        placeholder={t("namePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label className="flex flex-col gap-(--space-2)" htmlFor={kindId}>
        <span className="text-sm font-medium text-text-primary">
          {t("kindLabel")}
        </span>
        <select
          id={kindId}
          className="min-h-11 w-full rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          value={kind}
          onChange={(e) => {
            const nextKind = e.target.value as TransactionDirectionValue;
            setKind(nextKind);
            if (nextKind === TransactionDirection.INCOME) {
              setMappedJarId("");
            }
          }}
        >
          {TRANSACTION_DIRECTION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`kinds.${option}`)}
            </option>
          ))}
        </select>
      </label>
      {kind === TransactionDirection.EXPENSE ? (
        <label className="flex flex-col gap-(--space-2)" htmlFor={jarId}>
          <span className="text-sm font-medium text-text-primary">
            {t("jarLabel")}
          </span>
          <select
            id={jarId}
            required
            data-testid="category-jar-select"
            className="min-h-11 w-full rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            value={mappedJarId}
            onChange={(e) => setMappedJarId(e.target.value)}
          >
            <option value="">{t("jarRequired")}</option>
            {jars.map((jar) => (
              <option key={jar.id} value={jar.id}>
                {localizeCatalogName(tCatalog, "jars", jar.name) || jar.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <Button
        variant="primary"
        className="w-full"
        data-testid="category-create-submit"
        isDisabled={isPending || !online || !name.trim()}
        onPress={onSubmit}
      >
        {t("submit")}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        isDisabled={isPending}
        onPress={() => {
          statusAlert.hide();
          setOpen(false);
        }}
      >
        {t("cancel")}
      </Button>
    </div>
  );
}
