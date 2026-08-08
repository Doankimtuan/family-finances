"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AmountField } from "@/shared/patterns/amount-field";
import { Dialog, DialogContent } from "@/shared/patterns/dialog";
import { Sheet, SheetContent } from "@/shared/patterns/sheet";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { createAccountAction } from "./actions";
import {
  AccountType,
  ACCOUNT_TYPE_CREATE_OPTIONS,
  DEFAULT_CARD_DUE_DAY,
  DEFAULT_CARD_STATEMENT_DAY,
  type AccountType as AccountTypeValue,
} from "@/modules/ledger/application/client";
import {
  APP_PATH,
  moneyAccountPath,
} from "@/modules/tenancy/application/app-path";
import { TransactionReceipt } from "../transactions/transaction-receipt";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;
const TYPES = ACCOUNT_TYPE_CREATE_OPTIONS;

type LiquidOption = { id: string; name: string };

type Props = {
  liquidAccounts: LiquidOption[];
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
  open: openProp,
  onOpenChange,
  hideDefaultTrigger = false,
  presentation = "card",
}: Props) {
  const t = useTranslations("money.accountsPage");
  const tTypes = useTranslations("money.types");
  const { online } = useOnlineStatusClient();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountTypeValue>(AccountType.CASH);
  const [showExtras, setShowExtras] = useState(false);
  const [openingBalance, setOpeningBalance] = useState<number | null>(0);
  const [creditLimit, setCreditLimit] = useState<number | null>(null);
  const [statementDay, setStatementDay] = useState(DEFAULT_CARD_STATEMENT_DAY);
  const [dueDay, setDueDay] = useState(DEFAULT_CARD_DUE_DAY);
  const [linkedBankAccountId, setLinkedBankAccountId] = useState("");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<{
    accountId: string;
    accountName: string;
    accountType: AccountTypeValue;
    openingBalance: number;
    creditLimit: number | null;
  } | null>(null);

  const isCard = type === AccountType.CREDIT_CARD;

  const reset = () => {
    setName("");
    setType(AccountType.CASH);
    setShowExtras(false);
    setOpeningBalance(0);
    setCreditLimit(null);
    setStatementDay(DEFAULT_CARD_STATEMENT_DAY);
    setDueDay(DEFAULT_CARD_DUE_DAY);
    setLinkedBankAccountId("");
    setErrorCode(null);
    setReceipt(null);
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const onSubmit = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }

    if (isCard) {
      const limit = creditLimit ?? 0;
      if (!Number.isFinite(limit) || limit < 0 || !Number.isInteger(limit)) {
        setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
        return;
      }
      startTransition(async () => {
        const result = await createAccountAction({
          name: name.trim(),
          type: AccountType.CREDIT_CARD,
          openingBalance: 0,
          creditCard: {
            creditLimit: limit,
            statementDay,
            dueDay,
            linkedBankAccountId: linkedBankAccountId || null,
          },
        });
        if (result.status === "success") {
          setReceipt({
            accountId: result.accountId,
            accountName: name.trim(),
            accountType: AccountType.CREDIT_CARD,
            openingBalance: 0,
            creditLimit: limit,
          });
          return;
        }
        setErrorCode(result.code);
      });
      return;
    }

    const balance = openingBalance ?? 0;
    if (
      !Number.isFinite(balance) ||
      balance < 0 ||
      !Number.isInteger(balance)
    ) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    startTransition(async () => {
      const result = await createAccountAction({
        name: name.trim(),
        type,
        openingBalance: balance,
      });
      if (result.status === "success") {
        setReceipt({
          accountId: result.accountId,
          accountName: name.trim(),
          accountType: type,
          openingBalance: balance,
          creditLimit: null,
        });
        return;
      }
      setErrorCode(result.code);
    });
  };

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
                  value: receipt.creditLimit ?? 0,
                },
              ]
            : [
                {
                  id: "openingBalance",
                  label: t("receipt.openingBalance"),
                  value: receipt.openingBalance,
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
          <SheetContent>
            <Sheet.Body className="max-h-[min(70dvh,560px)] overflow-y-auto px-(--space-4) py-(--space-3)">
              {receiptContent}
            </Sheet.Body>
          </SheetContent>
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
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <fieldset className="flex flex-col gap-(--space-2)">
        <Text size="sm" className="font-semibold text-text-primary">
          {t("typeLabel")}
        </Text>
        {TYPES.map((value) => (
          <label
            key={value}
            className="flex min-h-11 cursor-pointer items-center gap-(--space-3)"
          >
            <input
              type="radio"
              name="accountType"
              value={value}
              checked={type === value}
              onChange={() => {
                setType(value);
                setShowExtras(true);
              }}
              className="size-4 accent-[var(--color-accent)]"
              data-testid={
                value === AccountType.CREDIT_CARD
                  ? "account-type-credit-card"
                  : undefined
              }
            />
            <span className="text-sm text-text-primary">{tTypes(value)}</span>
          </label>
        ))}
      </fieldset>
      {showExtras && !isCard ? (
        <div className="flex flex-col gap-(--space-1)">
          <AmountField
            id="account-opening-balance"
            label={t("openingBalanceLabel")}
            value={openingBalance}
            onValueChange={setOpeningBalance}
            data-testid="account-opening-balance"
          />
          <Text size="sm" tone="secondary">
            {t("openingBalanceHint")}
          </Text>
        </div>
      ) : null}
      {showExtras && isCard ? (
        <div
          className="flex flex-col gap-(--space-3)"
          data-testid="account-credit-card-settings"
        >
          <AmountField
            id="account-credit-limit"
            label={t("creditLimitLabel")}
            value={creditLimit}
            onValueChange={setCreditLimit}
            data-testid="account-credit-limit"
          />
          <TextField
            id="account-statement-day"
            label={t("statementDayLabel")}
            type="number"
            inputMode="numeric"
            value={String(statementDay)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setStatementDay(n);
            }}
            data-testid="account-statement-day"
          />
          <TextField
            id="account-due-day"
            label={t("dueDayLabel")}
            type="number"
            inputMode="numeric"
            value={String(dueDay)}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) setDueDay(n);
            }}
            data-testid="account-due-day"
          />
          <div className="flex flex-col gap-(--space-2)">
            <Text size="sm" className="font-semibold text-text-primary">
              {t("linkedBankLabel")}
            </Text>
            <select
              className="min-h-11 w-full rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm"
              value={linkedBankAccountId}
              onChange={(e) => setLinkedBankAccountId(e.target.value)}
              data-testid="account-linked-bank"
            >
              <option value="">{t("linkedBankNone")}</option>
              {liquidAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <Text size="sm" tone="secondary">
            {t("creditCardHint")}
          </Text>
        </div>
      ) : null}
    </div>
  );

  const actions = (
    <div className="flex flex-col gap-(--space-2)">
      <Button
        variant="primary"
        className="w-full"
        data-testid="account-add-submit"
        isDisabled={isPending || !online}
        onPress={onSubmit}
      >
        {isPending ? t("adding") : t("add")}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
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
          <SheetContent>
            <Sheet.Header className="px-(--space-4) pt-(--space-2)">
              <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
                {t("add")}
              </Sheet.Heading>
            </Sheet.Header>
            <Sheet.Body className="max-h-[min(60dvh,480px)] overflow-y-auto px-(--space-4) py-(--space-3)">
              {fields}
            </Sheet.Body>
            <Sheet.Footer className="flex flex-col gap-(--space-2) px-(--space-4) pb-(--space-4)">
              {actions}
            </Sheet.Footer>
          </SheetContent>
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
