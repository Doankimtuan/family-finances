"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  DebtCreationMode,
  DebtDirection,
  DEBT_CREATE_IDEMPOTENCY_KEY_PREFIX,
  createDebtIdempotencyKey,
} from "@/modules/ledger/application/ledger-constants";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  ProductActionStatus,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { AmountField } from "@/shared/patterns/amount-field";
import {
  ChoiceTile,
  ChoiceTileGroup,
} from "@/shared/patterns/choice-tile";
import {
  LabeledDateInput,
  LabeledSelect,
} from "@/shared/patterns/labeled-native-field";
import { Sheet, SheetContent } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Button } from "@/shared/ui/button";
import { AppIcon } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { TextField } from "@/shared/ui/form";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { createDebtAction } from "../money-products-actions";

type AccountOption = { id: string; name: string };
type DebtCreateSheetProps = { accounts: AccountOption[]; today: string };
type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

export function DebtCreateSheet({ accounts, today }: DebtCreateSheetProps) {
  const t = useTranslations("money.debtsPage");
  const tErrors = useTranslations("money.products.errors");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<DebtDirection>(
    DebtDirection.BORROWED,
  );
  const [creationMode, setCreationMode] = useState<DebtCreationMode>(
    DebtCreationMode.EXISTING_BALANCE,
  );
  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(today);
  const [dueDate, setDueDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const moneyMovesNow = creationMode === DebtCreationMode.MONEY_MOVED;
  const hasAccount = !moneyMovesNow || accountId !== "";

  function reset() {
    setDirection(DebtDirection.BORROWED);
    setCreationMode(DebtCreationMode.EXISTING_BALANCE);
    setCounterparty("");
    setAmount(null);
    setStartDate(today);
    setDueDate("");
    setAccountId("");
    setNote("");
    setErrorCode(null);
  }

  function handleOpenChange(next: boolean) {
    reset();
    setIsOpen(next);
  }

  function chooseDirection(next: DebtDirection) {
    setDirection(next);
    setAccountId("");
    setErrorCode(null);
  }

  function chooseCreationMode(next: DebtCreationMode) {
    setCreationMode(next);
    if (next === DebtCreationMode.EXISTING_BALANCE) setAccountId("");
    setErrorCode(null);
  }

  function submit() {
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (amount == null || amount <= 0 || !hasAccount || !counterparty.trim()) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    startTransition(async () => {
      const result = await createDebtAction({
        name: counterparty.trim(),
        counterparty: counterparty.trim(),
        direction,
        creationMode,
        principalAmount: amount,
        startDate,
        dueDate: dueDate || null,
        note: note.trim() || undefined,
        accountId: moneyMovesNow ? accountId : null,
        idempotencyKey: createDebtIdempotencyKey(
          DEBT_CREATE_IDEMPOTENCY_KEY_PREFIX,
        ),
      });
      if (result.status === ProductActionStatus.SUCCESS) {
        reset();
        setIsOpen(false);
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  }

  return (
    <Sheet isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button
        variant="primary"
        className="min-h-11 w-full"
        data-testid="debt-create-open"
        isDisabled={!online}
        onPress={() => handleOpenChange(true)}
      >
        {t("add")}
      </Button>
      <SheetContent>
        <Sheet.Header>
          <Sheet.Heading>{t("create.title")}</Sheet.Heading>
        </Sheet.Header>
        <Sheet.Body className="flex flex-col gap-(--space-4)">
          {errorCode ? (
            <StatusAlert variant="danger" title={tErrors(errorCode)} />
          ) : null}
          <FormGroupLabel>{t("create.relationship")}</FormGroupLabel>
          <ChoiceTileGroup
            hint={
              direction === DebtDirection.BORROWED
                ? t("create.borrowedDescription")
                : t("create.lentDescription")
            }
          >
            <ChoiceTile
              label={t("create.borrowed")}
              icon={
                <IconContainer
                  tone={
                    direction === DebtDirection.BORROWED ? "primary" : "neutral"
                  }
                  size="sm"
                >
                  <AppIcon icon={FINANCE_ICONS.debt} size="sm" />
                </IconContainer>
              }
              selected={direction === DebtDirection.BORROWED}
              onPress={() => chooseDirection(DebtDirection.BORROWED)}
            />
            <ChoiceTile
              label={t("create.lent")}
              icon={
                <IconContainer
                  tone={
                    direction === DebtDirection.LENT ? "primary" : "neutral"
                  }
                  size="sm"
                >
                  <AppIcon icon={FINANCE_ICONS.income} size="sm" />
                </IconContainer>
              }
              selected={direction === DebtDirection.LENT}
              onPress={() => chooseDirection(DebtDirection.LENT)}
            />
          </ChoiceTileGroup>
          <FormGroupLabel>{t("create.whoAndAmount")}</FormGroupLabel>
          <TextField
            id="debt-counterparty"
            label={
              direction === DebtDirection.BORROWED
                ? t("create.borrowedCounterparty")
                : t("create.lentCounterparty")
            }
            value={counterparty}
            onChange={(event) => setCounterparty(event.target.value)}
          />
          <AmountField
            id="debt-principal"
            label={t("create.principal")}
            value={amount}
            onValueChange={setAmount}
            required
          />
          <FormGroupLabel>{t("create.recordingMode")}</FormGroupLabel>
          <ChoiceTileGroup
            hint={
              creationMode === DebtCreationMode.EXISTING_BALANCE
                ? t("create.existingDescription")
                : t("create.moneyMovedDescription")
            }
          >
            <ChoiceTile
              label={t("create.existing")}
              icon={
                <IconContainer
                  tone={
                    creationMode === DebtCreationMode.EXISTING_BALANCE
                      ? "primary"
                      : "neutral"
                  }
                  size="sm"
                >
                  <AppIcon icon={FINANCE_ICONS.debt} size="sm" />
                </IconContainer>
              }
              selected={creationMode === DebtCreationMode.EXISTING_BALANCE}
              onPress={() =>
                chooseCreationMode(DebtCreationMode.EXISTING_BALANCE)
              }
            />
            <ChoiceTile
              label={t("create.moneyMoved")}
              icon={
                <IconContainer
                  tone={
                    creationMode === DebtCreationMode.MONEY_MOVED
                      ? "primary"
                      : "neutral"
                  }
                  size="sm"
                >
                  <AppIcon icon={FINANCE_ICONS.transfer} size="sm" />
                </IconContainer>
              }
              selected={creationMode === DebtCreationMode.MONEY_MOVED}
              onPress={() => chooseCreationMode(DebtCreationMode.MONEY_MOVED)}
            />
          </ChoiceTileGroup>
          {moneyMovesNow ? (
            <LabeledSelect
              label={
                direction === DebtDirection.BORROWED
                  ? t("create.receiveInto")
                  : t("create.lendFrom")
              }
              description={
                direction === DebtDirection.BORROWED
                  ? t("create.receiveIntoDescription")
                  : t("create.lendFromDescription")
              }
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              options={accounts.map((account) => ({
                id: account.id,
                label: account.name,
              }))}
            />
          ) : null}
          <FormGroupLabel>{t("create.timing")}</FormGroupLabel>
          <LabeledDateInput
            data-testid="debt-start-date"
            label={t("create.startDate")}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
          <LabeledDateInput
            data-testid="debt-due-date"
            label={t("create.dueDate")}
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            minValue={startDate || undefined}
          />
          <FormGroupLabel>{t("create.optionalDetails")}</FormGroupLabel>

          <TextField
            id="debt-note"
            label={t("create.note")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Sheet.Body>
        <SheetActionFooter
          secondaryLabel={t("cancel")}
          primaryLabel={isPending ? t("saving") : t("create.save")}
          primaryTestId="debt-create-submit"
          isDisabled={!online}
          isPending={isPending}
          onSecondary={() => handleOpenChange(false)}
          onPrimary={submit}
        />
      </SheetContent>
    </Sheet>
  );
}

function FormGroupLabel({ children }: { children: string }) {
  return (
    <Text size="sm" weight="medium" className="text-text-primary">
      {children}
    </Text>
  );
}
