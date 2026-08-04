"use client";

import { useId, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  PLAN_ACTION_ERROR_CODE,
  isEmergencyIntentValid,
  shouldShowOverspendWarning,
  type PlanActionErrorCode,
} from "@/modules/plan/application/client";
import {
  OverspendPolicy,
  type OverspendPolicy as OverspendPolicyValue,
} from "@/modules/tenancy/application/household-policies.schema";
import { AmountField } from "@/shared/patterns/amount-field";
import { TextField, CheckboxField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
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

type Props = {
  sourceJarId: string;
  capacityDelta: number;
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
  capacityDelta,
  currency,
  targetJars,
  overspendPolicy,
}: Props) {
  const t = useTranslations("plan.jars.reallocate");
  const tCatalog = useTranslations("catalog");
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
      amount: undefined as unknown as number,
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
        reset({
          sourceJarId,
          targetJarId: targetJars[0]?.id ?? "",
          amount: undefined as unknown as number,
          isEmergency: false,
          intentNote: "",
          warningAcknowledged: false,
        });
        setAwaitingWarn(false);
        setOpen(false);
        router.refresh();
        return;
      }

      if (result.code === PLAN_ACTION_ERROR_CODE.WARNING_REQUIRED) {
        setAwaitingWarn(true);
        return;
      }

      setErrorCode(result.code);
    });
  };

  return (
    <div
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
      data-testid="jar-reallocate-form"
    >
      <StatusAlert
        variant="info"
        title={t("virtualBannerTitle")}
        description={t("virtualBannerBody")}
      />

      <Text size="sm" tone="secondary" data-testid="jar-capacity-delta">
        {t("capacityDeltaLabel", {
          amount: capacityDelta,
          currency,
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

      <Controller
        control={control}
        name="amount"
        render={({ field }) => (
          <AmountField
            id={amountId}
            label={t("amountLabel")}
            value={typeof field.value === "number" ? field.value : null}
            onValueChange={(next) => {
              field.onChange(next ?? undefined);
            }}
            error={errors.amount?.message}
            data-testid="jar-reallocate-amount"
          />
        )}
      />

      <label className="flex flex-col gap-(--space-2)" htmlFor={targetId}>
        <span className="text-sm font-medium text-text-primary">
          {t("targetLabel")}
        </span>
        <select
          id={targetId}
          className="min-h-11 w-full rounded-md border border-border-subtle bg-surface px-(--space-3) text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          data-testid="jar-reallocate-target"
          {...register("targetJarId")}
        >
          {targetJars.map((jar) => (
            <option key={jar.id} value={jar.id}>
              {localizeCatalogName(tCatalog, "jars", jar.name) || jar.name}
            </option>
          ))}
        </select>
        {errors.targetJarId ? (
          <p className="text-sm text-danger" role="alert">
            {t(`errors.${asFieldErrorKey(errors.targetJarId.message)}`)}
          </p>
        ) : null}
      </label>

      <CheckboxField
        id={emergencyId}
        label={t("emergencyLabel")}
        data-testid="jar-reallocate-emergency"
        {...register("isEmergency", {
          onChange: (event) => {
            const checked = Boolean((event.target as HTMLInputElement).checked);
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

      <Button
        variant="primary"
        className="w-full"
        data-testid="jar-reallocate-submit"
        isDisabled={isPending || !online || amount == null || amount <= 0}
        onPress={() => {
          void handleSubmit(submitReallocate)();
        }}
      >
        {awaitingWarn ? t("warnContinue") : t("submit")}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        isDisabled={isPending}
        onPress={() => {
          setOpen(false);
          setAwaitingWarn(false);
          setErrorCode(null);
        }}
      >
        {t("cancel")}
      </Button>
    </div>
  );
}
