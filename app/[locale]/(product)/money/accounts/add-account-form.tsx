"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { IconPickerField, SelectField, TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { CurrencyInput } from "@/shared/ui/form";
import { Dialog, DialogContent } from "@/shared/patterns/dialog";
import { Sheet } from "@/shared/patterns/sheet";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { FinancialScopeField } from "@/shared/patterns/financial-scope-field";
import {
  ChoiceTile,
  ChoiceTileGroup,
  ChoiceTileLayout,
} from "@/shared/patterns/choice-tile";
import { FormSection } from "@/shared/ui/form/form-section";
import { FieldGroup } from "@/shared/ui/form/field-group";
import { InlineAlert } from "@/shared/ui/inline-alert";
import { IconContainer } from "@/shared/ui/icon-container";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { cn } from "@/shared/utils/cn";
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
import {
  ACCOUNT_ICON_KEYS,
  DEFAULT_ACCOUNT_ICON_KEY_BY_TYPE,
} from "@/modules/ledger/application/icon-constants";
import { ACCOUNT_ICON_BY_KEY } from "@/shared/ui/stitch-icon-choices";

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
  presentation?: "card" | "dialog" | "sheet" | "page";
  /** Locks the form to a route-specific account type. */
  fixedType?: AccountTypeValue;
  /** Keep credit-card creation on its dedicated route. */
  hideCreditCardType?: boolean;
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
  fixedType,
  hideCreditCardType = false,
}: Props) {
  const t = useTranslations("money.accountsPage");
  const tTypes = useTranslations("money.types");
  const tForms = useTranslations("forms");
  const tIcons = useTranslations("common.iconPicker");
  const locale = useLocale();
  const { online } = useOnlineStatusClient();
  const router = useRouter();
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
      type: fixedType ?? AccountType.CASH,
      iconKey: DEFAULT_ACCOUNT_ICON_KEY_BY_TYPE[fixedType ?? AccountType.CASH],
      openingBalance: 0,
      financialScope: FINANCIAL_SCOPE.HOUSEHOLD,
      creditCard:
        fixedType === AccountType.CREDIT_CARD
          ? {
              creditLimit: null,
              statementDay: DEFAULT_CARD_STATEMENT_DAY,
              dueDay: DEFAULT_CARD_DUE_DAY,
              linkedBankAccountId: null,
            }
          : undefined,
    },
  });
  const type = useWatch({ control, name: "type" }) ?? AccountType.CASH;
  const isCard = type === AccountType.CREDIT_CARD;

  const reset = () => {
    resetForm();
    setErrorCode(null);
    setReceipt(null);
  };

  const typeOptions = hideCreditCardType
    ? TYPES.filter((value) => value !== AccountType.CREDIT_CARD)
    : TYPES;

  const selectType = (nextType: AccountTypeValue) => {
    setValue("type", nextType, { shouldValidate: true });
    setValue("iconKey", DEFAULT_ACCOUNT_ICON_KEY_BY_TYPE[nextType]);
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
  };

  const close = () => {
    if (presentation === "page") {
      reset();
      router.push(APP_PATH.MONEY_ACCOUNTS);
      return;
    }
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
          iconKey: values.iconKey,
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
        iconKey: values.iconKey,
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
                  kind: "financial" as const,
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
                  kind: "financial" as const,
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
        ]}
      >
        <div className="rounded-(--radius-control) border border-success/25 bg-success/10 p-(--space-3)">
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
        <Sheet
          isOpen
          onOpenChange={(next) => {
            if (!next) close();
          }}
        >
          <ActionSheetLayout>
            <ActionSheetLayout.Body>{receiptContent}</ActionSheetLayout.Body>
          </ActionSheetLayout>
        </Sheet>
      );
    }
    return receiptContent;
  }

  const accountNameField = (
    <TextField
      id="account-name"
      label={isCard ? t("creditNameLabel") : t("nameLabel")}
      placeholder={isCard ? t("creditNamePlaceholder") : t("namePlaceholder")}
      className={
        presentation === "page"
          ? "dark:border-divider-subtle dark:bg-canvas"
          : undefined
      }
      registration={register("name")}
      error={errors.name ? t("errors.invalid") : undefined}
      required
    />
  );

  const accountIconField = (
    <Controller
      control={control}
      name="iconKey"
      render={({ field, fieldState }) => (
        <IconPickerField
          id="account-icon"
          label={tIcons("label")}
          value={field.value ?? DEFAULT_ACCOUNT_ICON_KEY_BY_TYPE[type]}
          onChange={field.onChange}
          options={ACCOUNT_ICON_KEYS.map((key) => ({
            key,
            label: tIcons(`choices.${key}`),
            icon: ACCOUNT_ICON_BY_KEY[key],
          }))}
          searchLabel={tIcons("search")}
          emptyLabel={tIcons("empty")}
          error={fieldState.error ? t("errors.invalid") : undefined}
          data-testid="account-icon"
        />
      )}
    />
  );

  const identityFields = (
    <FieldGroup columns={1}>
      {!fixedType ? (
        <SelectField
          id="account-type"
          label={t("typeLabel")}
          value={type}
          options={typeOptions.map((value) => ({
            id: value,
            label: tTypes(value),
          }))}
          onChange={(next) => selectType(next as AccountTypeValue)}
          required
          data-testid="account-type"
        />
      ) : null}
      {accountNameField}
      {accountIconField}
    </FieldGroup>
  );

  const openingBalanceField = (
    <Controller
      control={control}
      name="openingBalance"
      render={({ field, fieldState }) => (
        <CurrencyInput
          id="account-opening-balance"
          label={t("openingBalanceLabel")}
          value={field.value ?? null}
          onValueChange={field.onChange}
          onBlur={field.onBlur}
          showWordsPreview={false}
          error={fieldState.error ? t("errors.invalid") : undefined}
          data-testid="account-opening-balance"
        />
      )}
    />
  );

  const creditLimitField = (
    <Controller
      control={control}
      name="creditCard.creditLimit"
      render={({ field, fieldState }) => (
        <CurrencyInput
          id="account-credit-limit"
          label={t("creditLimitLabel")}
          labelAccessory={
            presentation === "page" ? (
              <StatusBadge tone={StatusBadgeTone.SELECTED}>
                {t("creditLimitAvailable")}
              </StatusBadge>
            ) : undefined
          }
          value={field.value ?? null}
          onValueChange={field.onChange}
          onBlur={field.onBlur}
          showWordsPreview={false}
          error={fieldState.error ? t("errors.invalid") : undefined}
          data-testid="account-credit-limit"
        />
      )}
    />
  );

  const creditDebtNotice = (
    <InlineAlert
      variant="warning"
      title={<span className="text-debt">{t("creditDebtNoticeTitle")}</span>}
      className="border-debt/20 bg-debt-soft text-debt dark:border-debt/40 dark:bg-debt-soft/80"
    >
      <span className="text-debt">{t("creditCardHint")}</span>
    </InlineAlert>
  );

  const billingDayFields = (
    <FieldGroup>
      <Controller
        control={control}
        name="creditCard.statementDay"
        render={({ field, fieldState }) => (
          <SelectField
            id="account-statement-day"
            label={t("statementDayLabel")}
            labelClassName="block min-[390px]:min-h-12"
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
            labelClassName="block min-[390px]:min-h-12"
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
    </FieldGroup>
  );

  const linkedBankField = (
    <Controller
      control={control}
      name="creditCard.linkedBankAccountId"
      render={({ field, fieldState }) => (
        <SelectField
          id="account-linked-bank"
          label={t("linkedBankLabel")}
          description={t("linkedBankDescription")}
          placeholder={t("linkedBankNone")}
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
  );

  const creditCardHint =
    presentation === "page" ? (
      <InlineAlert
        variant="info"
        className="border-primary/20 bg-primary-soft text-primary dark:border-divider-subtle dark:bg-canvas"
      >
        {t("creditInitialDebtHint")}
      </InlineAlert>
    ) : (
      <Text size="sm" tone="secondary">
        {t("creditCardHint")}
      </Text>
    );

  const creditCardFields = (
    <div
      className={cn(
        "flex flex-col gap-(--space-3)",
        presentation === "page" &&
          "[&_[data-slot=select-trigger]]:dark:border-divider-subtle [&_[data-slot=select-trigger]]:dark:bg-canvas",
      )}
      data-testid="account-credit-card-settings"
    >
      {creditLimitField}
      {presentation === "page" ? creditDebtNotice : null}
      {billingDayFields}
      {linkedBankField}
      {creditCardHint}
    </div>
  );

  const scopeField = (
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
  );

  const fields = (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="account-add-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={isCard ? t("addCreditCard") : t("add")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      <FormSection
        title={t(isCard ? "creditIdentitySection" : "identitySection")}
        variant={presentation === "page" ? "surface" : "plain"}
        className={
          presentation === "page"
            ? "bg-surface dark:border-divider-subtle"
            : undefined
        }
      >
        {identityFields}
      </FormSection>
      {isCard ? (
        <FormSection
          title={t("creditSettingsSection")}
          description={
            presentation === "page" ? undefined : t("creditInitialDebtHint")
          }
          variant={presentation === "page" ? "surface" : "plain"}
          className={
            presentation === "page"
              ? "bg-surface dark:border-divider-subtle"
              : undefined
          }
        >
          {creditCardFields}
        </FormSection>
      ) : (
        <FormSection
          title={t("openingBalanceSection")}
          description={t("openingBalanceHint")}
        >
          {openingBalanceField}
        </FormSection>
      )}
      <FormSection
        title={t("scopeSection")}
        variant={presentation === "page" ? "surface" : "plain"}
        className={
          presentation === "page"
            ? "bg-surface dark:border-divider-subtle"
            : undefined
        }
      >
        {scopeField}
      </FormSection>
    </div>
  );

  const stepTitle = (number: number, label: string) => (
    <span className="flex items-center gap-(--space-2)">
      <span className="rounded-(--radius-sm) bg-primary-soft px-(--space-2) py-(--space-1) text-xs font-medium text-primary">
        {t("stepLabel", { number })}
      </span>
      <span>{label}</span>
    </span>
  );

  const pageFields = (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="account-add-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("add")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      <InlineAlert
        variant="info"
        className="bg-primary-soft border-primary/20 text-primary dark:bg-primary-soft/80 dark:border-primary/50"
      >
        {t("accountMeaningHint")}
      </InlineAlert>
      {!fixedType ? (
        <FormSection
          title={stepTitle(1, t("typeLabel"))}
          variant="surface"
          className="bg-surface dark:border-divider-subtle"
        >
          <div
            role="group"
            aria-label={t("typeLabel")}
            data-testid="account-type"
          >
            <ChoiceTileGroup>
              {typeOptions.map((value) => {
                const isSelected = type === value;
                return (
                  <ChoiceTile
                    key={value}
                    label={tTypes(value)}
                    layout={ChoiceTileLayout.STACKED}
                    icon={
                      <IconContainer
                        tone={isSelected ? "primary" : "neutral"}
                        size="sm"
                        className={
                          isSelected
                            ? "border border-primary/20 bg-surface dark:border-transparent dark:bg-primary/20"
                            : "border border-border-subtle bg-surface dark:border-transparent dark:bg-surface-muted"
                        }
                      >
                        <AppIcon
                          icon={
                            ACCOUNT_ICON_BY_KEY[
                              DEFAULT_ACCOUNT_ICON_KEY_BY_TYPE[value]
                            ]
                          }
                          size={AppIconSize.SM}
                        />
                      </IconContainer>
                    }
                    selected={isSelected}
                    onPress={() => selectType(value)}
                    className={
                      isSelected
                        ? "min-h-16 border-2 border-primary bg-primary-soft/40 shadow-none ring-0 dark:bg-primary-soft/50"
                        : "min-h-16 border border-border-subtle bg-surface dark:border-divider-subtle dark:hover:border-border-subtle"
                    }
                  />
                );
              })}
            </ChoiceTileGroup>
          </div>
        </FormSection>
      ) : null}
      <FormSection
        title={stepTitle(
          2,
          t(isCard ? "creditIdentitySection" : "identitySection"),
        )}
        variant="surface"
        className="bg-surface dark:border-divider-subtle"
      >
        {accountNameField}
        {accountIconField}
        <div className="border-t border-border-subtle pt-(--space-3)">
          {scopeField}
        </div>
      </FormSection>
      {isCard ? (
        <FormSection
          title={stepTitle(3, t("creditSettingsSection"))}
          variant="surface"
          className="bg-surface dark:border-divider-subtle"
        >
          {creditCardFields}
        </FormSection>
      ) : (
        <FormSection
          title={stepTitle(3, t("openingBalanceSection"))}
          description={t("openingBalanceHint")}
          variant="surface"
          className="bg-surface dark:border-divider-subtle"
        >
          {openingBalanceField}
        </FormSection>
      )}
    </div>
  );

  const creditTypeSummary = (
    <div
      role="group"
      aria-label={t("typeLabel")}
      className="flex items-center gap-(--space-3) rounded-(--radius-control) border border-border-subtle bg-surface px-(--space-3) py-(--space-2) dark:border-divider-subtle"
      data-testid="account-credit-type-summary"
    >
      <IconContainer
        tone="primary"
        size="sm"
        className="border border-primary/20 bg-primary-soft/40 dark:border-transparent"
      >
        <AppIcon
          icon={
            ACCOUNT_ICON_BY_KEY[
              DEFAULT_ACCOUNT_ICON_KEY_BY_TYPE[AccountType.CREDIT_CARD]
            ]
          }
          size={AppIconSize.SM}
        />
      </IconContainer>
      <div className="flex min-w-0 flex-col">
        <Text size="xs" tone="secondary">
          {t("typeLabel")}
        </Text>
        <Text size="sm">{tTypes(AccountType.CREDIT_CARD)}</Text>
      </div>
    </div>
  );

  const creditPageFields = (
    <div
      className="flex flex-col gap-(--space-4) [&_[data-slot=select-trigger]]:dark:border-divider-subtle [&_[data-slot=select-trigger]]:dark:bg-canvas"
      data-testid="account-credit-page-fields"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("addCreditCard")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      {creditTypeSummary}
      {creditDebtNotice}
      <FormSection
        title={stepTitle(1, t("creditIdentitySection"))}
        variant="surface"
        className="bg-surface dark:border-divider-subtle"
        testId="account-credit-step-identity"
      >
        <FieldGroup columns={1}>
          {accountNameField}
          {accountIconField}
        </FieldGroup>
        <div className="border-t border-border-subtle pt-(--space-3)">
          {scopeField}
        </div>
      </FormSection>
      <div
        className="flex flex-col gap-(--space-4)"
        data-testid="account-credit-card-settings"
      >
        <FormSection
          title={stepTitle(2, t("creditSettingsSection"))}
          variant="surface"
          className="bg-surface dark:border-divider-subtle"
          testId="account-credit-step-limit"
        >
          {creditLimitField}
          {creditCardHint}
        </FormSection>
        <FormSection
          title={stepTitle(3, t("creditBillingSection"))}
          variant="surface"
          className="bg-surface dark:border-divider-subtle"
          testId="account-credit-step-billing"
        >
          {billingDayFields}
        </FormSection>
        <FormSection
          title={stepTitle(4, t("creditPaymentSection"))}
          action={
            <StatusBadge tone={StatusBadgeTone.NEUTRAL}>
              {tForms("optional")}
            </StatusBadge>
          }
          variant="surface"
          className="bg-surface dark:border-divider-subtle"
          testId="account-credit-step-payment"
        >
          {linkedBankField}
        </FormSection>
      </div>
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

  const resolvePageFields = () => {
    if (!fixedType) return pageFields;
    if (!isCard) return fields;
    return creditPageFields;
  };
  const stickySubmitLabel = isCard ? t("addCreditCard") : t("add");

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
              <Text
                size="sm"
                tone="secondary"
                className="mt-(--space-1) text-pretty"
              >
                {t("addDescription")}
              </Text>
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
            <Text
              size="sm"
              tone="secondary"
              className="mt-(--space-1) text-pretty"
            >
              {t("addDescription")}
            </Text>
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

  if (presentation === "page") {
    return (
      <form
        onSubmit={onSubmit}
        className="flex flex-1 flex-col gap-(--space-4)"
        data-testid="account-add-page-form"
      >
        {resolvePageFields()}
        <Button
          type="submit"
          fullWidth
          isDisabled={isPending || !online}
          data-testid="account-add-submit"
        >
          {isPending ? t("adding") : stickySubmitLabel}
        </Button>
      </form>
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
    <div className="flex flex-col gap-(--space-3) rounded-(--radius-card) border border-border-subtle bg-surface p-(--space-4)">
      {fields}
      {actions}
    </div>
  );
}
