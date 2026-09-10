"use client";

import { useId, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  PLAN_ACTION_ERROR_CODE,
  PLAN_MOVEMENT_LEDGER_IMPACT,
  isEmergencyIntentValid,
  shouldShowOverspendWarning,
  type PlanActionErrorCode,
} from "@/modules/plan/application/client";
import {
  OverspendPolicy,
  type OverspendPolicy as OverspendPolicyValue,
} from "@/modules/tenancy/application/household-policies.schema";
import {
  APP_PATH,
  inboxItemPath,
} from "@/modules/tenancy/application/app-path";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { TextField, CheckboxField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Sheet } from "@/shared/patterns/sheet";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { Section } from "@/shared/patterns/section";
import { FinancialValue } from "@/shared/patterns/financial-value";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { formatCurrency } from "@/shared/i18n/formatters";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { reallocateJarCapacityAction } from "./actions";

const formSchema = z
  .object({
    sourceJarId: z.string().uuid(),
    targetJarId: z.string().uuid(),
    amount: z.number().int().positive(),
    isEmergency: z.boolean(),
    intentNote: z.string().trim().max(280).optional().nullable(),
    warningAcknowledged: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.sourceJarId === value.targetJarId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PLAN_ACTION_ERROR_CODE.SAME_JAR,
        path: ["targetJarId"],
      });
    }
    if (
      !isEmergencyIntentValid({
        isEmergency: value.isEmergency,
        intentNote: value.intentNote,
      })
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED,
        path: ["intentNote"],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

type ErrorCode =
  | ProductActionErrorCode
  | PlanActionErrorCode
  | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

type FieldErrorKey =
  | typeof PLAN_ACTION_ERROR_CODE.SAME_JAR
  | typeof PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED
  | typeof PRODUCT_ACTION_ERROR_CODE.INVALID;

type JarOption = {
  id: string;
  name: string;
};

type ReceiptState = {
  amount: number;
  sourceName: string;
  targetName: string;
  inboxItemId: string | null;
  isEmergency: boolean;
};

type Props = {
  sourceJarId: string;
  sourceJarName: string;
  availableToMove: number;
  currency: string;
  targetJars: JarOption[];
  overspendPolicy: OverspendPolicyValue;
};

function asFieldErrorKey(message: string | undefined): FieldErrorKey {
  if (message === PLAN_ACTION_ERROR_CODE.SAME_JAR) {
    return PLAN_ACTION_ERROR_CODE.SAME_JAR;
  }
  if (message === PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED) {
    return PLAN_ACTION_ERROR_CODE.EMERGENCY_NOTE_REQUIRED;
  }
  return PRODUCT_ACTION_ERROR_CODE.INVALID;
}

/**
 * Virtual jar capacity reallocation (BR-01 / AC-JAR-01) with emergency (AC-JAR-02).
 */
export function ReallocateJarForm({
  sourceJarId,
  sourceJarName,
  availableToMove,
  currency,
  targetJars,
  overspendPolicy,
}: Props) {
  const t = useTranslations("plan.jars.reallocate");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const amountId = useId();
  const targetId = useId();
  const emergencyId = useId();
  const noteId = useId();
  const warnAckId = useId();
  const { online } = useOnlineStatusClient();
  const [open, setOpen] = useState(false);
  const [awaitingWarn, setAwaitingWarn] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceJarId,
      targetJarId: targetJars[0]?.id ?? "",
      isEmergency: false,
      intentNote: "",
      warningAcknowledged: false,
    },
  });

  const isEmergency = useWatch({ control, name: "isEmergency" });
  const amount = useWatch({ control, name: "amount" });

  if (targetJars.length === 0) {
    return null;
  }

  if (receipt) {
    return (
      <Section variant="surface" testId="jar-reallocate-receipt">
        <StatusAlert
          variant="success"
          title={t("receiptTitle")}
          description={t("receiptOutcome")}
        />
        <dl className="flex flex-col gap-(--space-3)">
          <div className="flex justify-between gap-(--space-3)">
            <Text size="sm" tone="secondary">
              {t("receiptPlan")}
            </Text>
            <Text size="sm" className="font-medium text-text-primary">
              {t("receiptPlanChanged")}
            </Text>
          </div>
          <div className="flex justify-between gap-(--space-3)">
            <Text size="sm" tone="secondary">
              {t("receiptMoney")}
            </Text>
            <Text size="sm" className="font-medium text-text-primary">
              {t("receiptMoneyUnchanged")}
            </Text>
          </div>
          <div className="flex justify-between gap-(--space-3)">
            <Text size="sm" tone="secondary">
              {t("amountLabel")}
            </Text>
            <Text
              size="sm"
              className="tabular-nums font-medium text-text-primary"
              data-financial-kind={FinancialNumberKind.INTENTION}
            >
              <FinancialValue>
                {formatCurrency(receipt.amount, currency, locale, {
                  maximumFractionDigits: 0,
                })}
              </FinancialValue>
            </Text>
          </div>
          <div className="flex justify-between gap-(--space-3)">
            <Text size="sm" tone="secondary">
              {t("receiptFrom")}
            </Text>
            <Text
              size="sm"
              className="text-right font-medium text-text-primary"
            >
              {receipt.sourceName}
            </Text>
          </div>
          <div className="flex justify-between gap-(--space-3)">
            <Text size="sm" tone="secondary">
              {t("receiptTo")}
            </Text>
            <Text
              size="sm"
              className="text-right font-medium text-text-primary"
            >
              {receipt.targetName}
            </Text>
          </div>
        </dl>
        {receipt.inboxItemId ? (
          <Link
            href={inboxItemPath(receipt.inboxItemId)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
            data-testid="jar-reallocate-inbox-link"
          >
            {t("receiptInbox")}
          </Link>
        ) : null}
        <Button
          variant="primary"
          className="w-full"
          data-testid="jar-reallocate-receipt-done"
          onPress={() => {
            setReceipt(null);
            router.refresh();
          }}
        >
          {t("receiptDone")}
        </Button>
        <Link
          href={APP_PATH.PLAN_JARS}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
        >
          {t("receiptBackJars")}
        </Link>
      </Section>
    );
  }

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="w-full"
        data-testid="jar-reallocate-open"
        isDisabled={!online}
        onPress={() => {
          setErrorCode(null);
          setAwaitingWarn(false);
          setOpen(true);
        }}
      >
        {t("open")}
      </Button>
    );
  }

  const submitReallocate = (values: FormValues) => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (values.amount > availableToMove) {
      setErrorCode(PLAN_ACTION_ERROR_CODE.CAPACITY_BLOCKED);
      return;
    }

    const needsWarn = shouldShowOverspendWarning({
      isEmergency: values.isEmergency,
      overspendPolicy,
    });

    if (needsWarn && !values.warningAcknowledged && !awaitingWarn) {
      setAwaitingWarn(true);
      return;
    }

    const acknowledged =
      values.warningAcknowledged || awaitingWarn || values.isEmergency;

    if (needsWarn && !acknowledged) {
      setAwaitingWarn(true);
      setErrorCode(PLAN_ACTION_ERROR_CODE.WARNING_REQUIRED);
      return;
    }

    startTransition(async () => {
      const result = await reallocateJarCapacityAction({
        sourceJarId: values.sourceJarId,
        targetJarId: values.targetJarId,
        amount: values.amount,
        isEmergency: values.isEmergency,
        intentNote: values.intentNote?.trim() || null,
        warningAcknowledged: acknowledged,
      });

      if (result.status === "success") {
        if (
          result.ledgerTransactionsCreated !== 0 ||
          result.ledgerImpact !== PLAN_MOVEMENT_LEDGER_IMPACT
        ) {
          setErrorCode(PRODUCT_ACTION_ERROR_CODE.UNKNOWN);
          return;
        }

        const target =
          targetJars.find((jar) => jar.id === result.targetJarId) ??
          targetJars.find((jar) => jar.id === values.targetJarId);
        const targetName = target
          ? localizeCatalogName(tCatalog, "jars", target.name) || target.name
          : values.targetJarId;

        reset({
          sourceJarId,
          targetJarId: targetJars[0]?.id ?? "",
          isEmergency: false,
          intentNote: "",
          warningAcknowledged: false,
        });
        setAwaitingWarn(false);
        setOpen(false);
        setReceipt({
          amount: result.amount,
          sourceName: sourceJarName,
          targetName,
          inboxItemId: result.inboxItemId,
          isEmergency: result.isEmergency,
        });
        return;
      }

      if (result.code === PLAN_ACTION_ERROR_CODE.WARNING_REQUIRED) {
        setAwaitingWarn(true);
        return;
      }

      setErrorCode(result.code);
    });
  };

  const close = () => {
    setOpen(false);
    setAwaitingWarn(false);
    setErrorCode(null);
  };

  return (
    <Sheet isOpen onOpenChange={(next) => !next && close()}>
      <ActionSheetLayout>
        <ActionSheetLayout.Header>
          <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
            {t("open")}
          </Sheet.Heading>
        </ActionSheetLayout.Header>
        <ActionSheetLayout.Body>
          <div
            className="flex flex-col gap-(--space-3)"
            data-testid="jar-reallocate-form"
          >
            <StatusAlert
              variant="info"
              title={t("virtualBannerTitle")}
              description={t("virtualBannerBody")}
            />

            <Text
              size="sm"
              tone="secondary"
              data-testid="jar-available-to-move"
              data-financial-kind={FinancialNumberKind.INTENTION}
            >
              {t.rich("availableToMoveValue", {
                amount: formatCurrency(availableToMove, currency, locale, {
                  maximumFractionDigits: 0,
                }),
                money: (chunks) => <FinancialValue>{chunks}</FinancialValue>,
              })}
            </Text>

            {errorCode ? (
              <StatusAlert
                variant="danger"
                title={t("open")}
                description={t(`errors.${errorCode}`)}
              />
            ) : null}

            {awaitingWarn && overspendPolicy === OverspendPolicy.WARN ? (
              <div
                className="flex flex-col gap-(--space-3)"
                data-testid="jar-reallocate-warn"
              >
                <StatusAlert
                  variant="warning"
                  title={t("warnTitle")}
                  description={t("warnBody")}
                />
                <CheckboxField
                  id={warnAckId}
                  label={t("warnAcknowledge")}
                  {...register("warningAcknowledged")}
                />
              </div>
            ) : null}

            <ControlledField
              control={control}
              field={{
                type: "amount",
                name: "amount",
                id: amountId,
                label: t("amountLabel"),
                testId: "jar-reallocate-amount",
                emptyValue: undefined,
              }}
            />

            <ControlledField
              control={control}
              field={{
                type: "select",
                name: "targetJarId",
                id: targetId,
                label: t("targetLabel"),
                options: targetJars.map((jar) => ({
                  id: jar.id,
                  label:
                    localizeCatalogName(tCatalog, "jars", jar.name) || jar.name,
                })),
                error: errors.targetJarId
                  ? t(`errors.${asFieldErrorKey(errors.targetJarId.message)}`)
                  : undefined,
                testId: "jar-reallocate-target",
              }}
            />

            <CheckboxField
              id={emergencyId}
              label={t("emergencyLabel")}
              data-testid="jar-reallocate-emergency"
              {...register("isEmergency", {
                onChange: (event) => {
                  const checked = Boolean(
                    (event.target as HTMLInputElement).checked,
                  );
                  setValue("isEmergency", checked);
                  if (checked) {
                    setAwaitingWarn(false);
                    setValue("warningAcknowledged", false);
                  }
                },
              })}
            />

            {isEmergency ? (
              <TextField
                id={noteId}
                label={t("intentNoteLabel")}
                description={t("intentNoteHint")}
                required
                registration={register("intentNote")}
                error={
                  errors.intentNote
                    ? t(`errors.${asFieldErrorKey(errors.intentNote.message)}`)
                    : undefined
                }
                data-testid="jar-reallocate-intent-note"
              />
            ) : null}

            <input type="hidden" {...register("sourceJarId")} />
          </div>
        </ActionSheetLayout.Body>
        <SheetActionFooter
          secondaryLabel={t("cancel")}
          primaryLabel={awaitingWarn ? t("warnContinue") : t("submit")}
          onSecondary={close}
          onPrimary={() => void handleSubmit(submitReallocate)()}
          primaryTestId="jar-reallocate-submit"
          isDisabled={!online}
          isPrimaryDisabled={
            amount == null || amount <= 0 || amount > availableToMove
          }
          isPending={isPending}
        />
      </ActionSheetLayout>
    </Sheet>
  );
}
