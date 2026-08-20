"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { SelectField, TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AmountField } from "@/shared/patterns/amount-field";
import { Dialog, DialogContent } from "@/shared/patterns/dialog";
import { Sheet } from "@/shared/patterns/sheet";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { FinancialScopeField } from "@/shared/patterns/financial-scope-field";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { createAccountAction } from "./actions";
import {
  AccountType,
  ACCOUNT_TYPE_CREATE_OPTIONS,
  DEFAULT_CARD_DUE_DAY,
  DEFAULT_CARD_STATEMENT_DAY,
  CALENDAR_DAY_VALUES,
  type AccountType as AccountTypeValue,
} from "@/modules/ledger/application/client";
import {
  createAccountInputSchema,
  type CreateAccountInput,
} from "@/modules/ledger/application/commands/create-account.schema";
import {
  APP_PATH,
  moneyAccountPath,
} from "@/modules/tenancy/application/app-path";
import { TransactionReceipt } from "../transactions/transaction-receipt";
import { formatCurrency } from "@/shared/i18n/formatters";
import { FINANCIAL_SCOPE } from "@/modules/shared-kernel/application/financial-scope";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;
const TYPES = ACCOUNT_TYPE_CREATE_OPTIONS;
const CARD_DAY_OPTIONS = CALENDAR_DAY_VALUES.map((day) => ({
  id: String(day),
  label: String(day),
}));

type LiquidOption = { id: string; name: string };
type CreateAccountFormInput = z.input<typeof createAccountInputSchema>;

type Props = {
  liquidAccounts: LiquidOption[];
  currency: string;
  /** When set with onOpenChange, form open state is controlled by the parent. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the default full-width open button (parent supplies the trigger). */
  hideDefaultTrigger?: boolean;
  /**
   * Present form as inline card, centered dialog, or bottom sheet.
   * Money hub create CTA uses sheet (UX: short sheet).
   */
  presentation?: "card" | "dialog" | "sheet";
};

/**
 * Progressive add-account form: name → type → opening balance or CC settings.
 * Savings is not a create option here (term savings is a separate Money section).
 */
export function AddAccountForm({
  liquidAccounts,
  currency,
  open: openProp,
  onOpenChange,
  hideDefaultTrigger = false,
  presentation = "card",
}: Props) {
  const t = useTranslations("money.accountsPage");
  const tTypes = useTranslations("money.types");
  const locale = useLocale();
  const { online } = useOnlineStatusClient();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<{
    accountId: string;
    accountName: string;
    accountType: AccountTypeValue;
    openingBalance: number;
    creditLimit: number | null;
  } | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset: resetForm,
    setValue,
    formState: { errors },
  } = useForm<CreateAccountFormInput, unknown, CreateAccountInput>({
    resolver: zodResolver(createAccountInputSchema),
    defaultValues: {
      name: "",
      type: AccountType.CASH,
      openingBalance: 0,
      financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
      creditCard: undefined,
    },
  });
  const type = useWatch({ control, name: "type" }) ?? AccountType.CASH;
  const isCard = type === AccountType.CREDIT_CARD;

  const reset = () => {
    resetForm();
    setErrorCode(null);
    setReceipt(null);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const onSubmit = handleSubmit((values) => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }

    if (values.type === AccountType.CREDIT_CARD) {
      const creditCard = values.creditCard;
      if (!creditCard) return;
      startTransition(async () => {
        const result = await createAccountAction({
          name: values.name,
          type: AccountType.CREDIT_CARD,
          openingBalance: 0,
          financialScope: values.financialScope,
          creditCard: {
            ...creditCard,
          },
        });
        if (result.status === "success") {
          setReceipt({
            accountId: result.accountId,
            accountName: values.name,
            accountType: AccountType.CREDIT_CARD,
            openingBalance: 0,
            creditLimit: creditCard.creditLimit ?? 0,
          });
          return;
        }
        setErrorCode(result.code);
      });
      return;
    }

    startTransition(async () => {
      const result = await createAccountAction({
        name: values.name,
        type: values.type ?? AccountType.OTHER,
        openingBalance: values.openingBalance ?? 0,
        financialScope: values.financialScope ?? FINANCIAL_SCOPE.HOUSEHOLD,
      });
      if (result.status === "success") {
        setReceipt({
          accountId: result.accountId,
          accountName: values.name,
          accountType: values.type ?? AccountType.OTHER,
          openingBalance: values.openingBalance ?? 0,
          creditLimit: null,
        });
        return;
      }
      setErrorCode(result.code);
    });
  });

  if (receipt) {
    const receiptContent = (
      <TransactionReceipt
        title={t("receipt.title")}
        rows={[
          { id: "name", label: t("receipt.name"), value: receipt.accountName },
          {
            id: "type",
            label: t("receipt.type"),
            value: tTypes(receipt.accountType),
          },
          ...(receipt.accountType === AccountType.CREDIT_CARD
            ? [
                {
                  id: "creditLimit",
                  label: t("receipt.creditLimit"),
                  financial: true,
                  value: formatCurrency(
                    receipt.creditLimit ?? 0,
                    currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  ),
                },
              ]
            : [
                {
                  id: "openingBalance",
                  label: t("receipt.openingBalance"),
                  financial: true,
                  value: formatCurrency(
                    receipt.openingBalance,
                    currency,
                    locale,
                    { maximumFractionDigits: 0 },
                  ),
                },
              ]),
        ]}
        nextActions={[
          {
            id: "view-account",
            label: t("receipt.viewAccount"),
            href: moneyAccountPath(receipt.accountId),
            variant: "primary",
          },
          {
            id: "add-another",
            label: t("receipt.addAnother"),
            onPress: reset,
            variant: "secondary",
          },
          {
            id: "money",
            label: t("receipt.goToMoney"),
            href: APP_PATH.MONEY,
            variant: "secondary",
          },
        ]}
      >
        <div className="rounded-lg border border-success/25 bg-success/10 p-(--space-3)">
          <Text size="sm" tone="secondary">
            {receipt.accountType === AccountType.CREDIT_CARD
              ? t("creditCardHint")
              : t("openingBalanceHint")}
          </Text>
        </div>
      </TransactionReceipt>
    );

    if (presentation === "dialog") {
      return (
        <Dialog isOpen onOpenChange={() => {}}>
          <DialogContent className="max-h-[min(90dvh,720px)]">
            <div className="max-h-[min(60dvh,480px)] overflow-y-auto p-(--space-4)">
              {receiptContent}
            </div>
          </DialogContent>
        </Dialog>
      );
    }
    if (presentation === "sheet") {
      return (
        <Sheet isOpen onOpenChange={() => {}}>
          <ActionSheetLayout>
            <ActionSheetLayout.Body>{receiptContent}</ActionSheetLayout.Body>
          </ActionSheetLayout>
        </Sheet>
      );
    }
    return receiptContent;
  }

  const fields = (
    <div
      className="flex flex-col gap-(--space-3)"
      data-testid="account-add-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("add")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      <TextField
        id="account-name"
        label={t("nameLabel")}
        placeholder={t("namePlaceholder")}
        registration={register("name")}
        error={errors.name ? t("errors.invalid") : undefined}
      />
      <Controller
        control={control}
        name="financialScope"
        render={({ field, fieldState }) => (
          <FinancialScopeField
            value={field.value ?? FINANCIAL_SCOPE.HOUSEHOLD}
            onChange={field.onChange}
            error={fieldState.error ? t("errors.invalid") : undefined}
            testId="account-financial-scope"
          />
        )}
      />
      <SelectField
        id="account-type"
        label={t("typeLabel")}
        value={type}
        options={TYPES.map((value) => ({ id: value, label: tTypes(value) }))}
        onChange={(next) => {
          const nextType = next as AccountTypeValue;
          setValue("type", nextType, { shouldValidate: true });
          setValue(
            "creditCard",
            nextType === AccountType.CREDIT_CARD
              ? {
                  creditLimit: null,
                  statementDay: DEFAULT_CARD_STATEMENT_DAY,
                  dueDay: DEFAULT_CARD_DUE_DAY,
                  linkedBankAccountId: null,
                }
              : undefined,
          );
          setValue("openingBalance", 0);
        }}
        required
        data-testid="account-type"
      />
      {!isCard ? (
        <div className="flex flex-col gap-(--space-1)">
          <Controller
            control={control}
            name="openingBalance"
            render={({ field, fieldState }) => (
              <AmountField
                id="account-opening-balance"
                label={t("openingBalanceLabel")}
                value={field.value ?? null}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                description={t("openingBalanceHint")}
                error={fieldState.error ? t("errors.invalid") : undefined}
                data-testid="account-opening-balance"
              />
            )}
          />
        </div>
      ) : null}
      {isCard ? (
        <div
          className="flex flex-col gap-(--space-3)"
          data-testid="account-credit-card-settings"
        >
          <Controller
            control={control}
            name="creditCard.creditLimit"
            render={({ field, fieldState }) => (
              <AmountField
                id="account-credit-limit"
                label={t("creditLimitLabel")}
                value={field.value ?? null}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error ? t("errors.invalid") : undefined}
                data-testid="account-credit-limit"
              />
            )}
          />
          <Controller
            control={control}
            name="creditCard.statementDay"
            render={({ field, fieldState }) => (
              <SelectField
                id="account-statement-day"
                label={t("statementDayLabel")}
                value={String(field.value)}
                onChange={(value) => field.onChange(Number(value))}
                onBlur={field.onBlur}
                options={CARD_DAY_OPTIONS}
                required
                error={fieldState.error ? t("errors.invalid") : undefined}
                data-testid="account-statement-day"
              />
            )}
          />
          <Controller
            control={control}
            name="creditCard.dueDay"
            render={({ field, fieldState }) => (
              <SelectField
                id="account-due-day"
                label={t("dueDayLabel")}
                value={String(field.value)}
                onChange={(value) => field.onChange(Number(value))}
                onBlur={field.onBlur}
                options={CARD_DAY_OPTIONS}
                required
                error={fieldState.error ? t("errors.invalid") : undefined}
                data-testid="account-due-day"
              />
            )}
          />
          <Controller
            control={control}
            name="creditCard.linkedBankAccountId"
            render={({ field, fieldState }) => (
              <SelectField
                id="account-linked-bank"
                label={t("linkedBankLabel")}
                value={field.value ?? ""}
                onChange={(next) => field.onChange(next || null)}
                onBlur={field.onBlur}
                options={[
                  { id: "", label: t("linkedBankNone") },
                  ...liquidAccounts.map((account) => ({
                    id: account.id,
                    label: account.name,
                  })),
                ]}
                error={fieldState.error ? t("errors.invalid") : undefined}
                data-testid="account-linked-bank"
              />
            )}
          />
          <Text size="sm" tone="secondary">
            {t("creditCardHint")}
          </Text>
        </div>
      ) : null}
    </div>
  );

  const actions = (
    <div className="flex items-center justify-end gap-(--space-2)">
      <Button
        variant="primary"
        size="sm"
        data-testid="account-add-submit"
        isDisabled={isPending || !online}
        onPress={() => onSubmit()}
      >
        {isPending ? t("adding") : t("add")}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        isDisabled={isPending}
        onPress={close}
      >
        {t("cancel")}
      </Button>
    </div>
  );

  if (presentation === "dialog" || presentation === "sheet") {
    if (!open) return null;
    if (presentation === "sheet") {
      return (
        <Sheet
          isOpen
          onOpenChange={(next) => {
            if (!next) close();
          }}
        >
          <ActionSheetLayout>
            <ActionSheetLayout.Header>
              <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
                {t("add")}
              </Sheet.Heading>
            </ActionSheetLayout.Header>
            <ActionSheetLayout.Body>{fields}</ActionSheetLayout.Body>
            <SheetActionFooter
              secondaryLabel={t("cancel")}
              primaryLabel={isPending ? t("adding") : t("add")}
              onSecondary={close}
              onPrimary={() => onSubmit()}
              primaryTestId="account-add-submit"
              isDisabled={!online}
              isPending={isPending}
            />
          </ActionSheetLayout>
        </Sheet>
      );
    }
    return (
      <Dialog
        isOpen
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        <DialogContent className="max-h-[min(90dvh,720px)]">
          <Dialog.Header className="px-(--space-4) pt-(--space-4)">
            <Dialog.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("add")}
            </Dialog.Heading>
          </Dialog.Header>
          <Dialog.Body className="max-h-[min(60dvh,480px)] overflow-y-auto px-(--space-4) py-(--space-3)">
            {fields}
          </Dialog.Body>
          <Dialog.Footer className="flex flex-col gap-(--space-2) px-(--space-4) pb-(--space-4)">
            {actions}
          </Dialog.Footer>
        </DialogContent>
      </Dialog>
    );
  }

  if (!open) {
    if (hideDefaultTrigger) {
      return null;
    }
    return (
      <Button
        variant="secondary"
        className="w-full"
        data-testid="account-add-open"
        isDisabled={!online}
        onPress={() => {
          if (!online) {
            setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
            return;
          }
          setErrorCode(null);
          setOpen(true);
        }}
      >
        {online ? t("add") : t("errors.offline")}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)">
      {fields}
      {actions}
    </div>
  );
}
