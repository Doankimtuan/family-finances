"use client";

import { useId, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  JarKind,
  JarPlanKind,
  JarRolloverMode,
  JAR_KIND_VALUES,
  JAR_PLAN_KIND_VALUES,
  jarCategoryIdsSchema,
  jarConfigurationInputSchema,
  type JarConfigurationInput,
  type JarPlan,
  type JarKind as JarKindValue,
  type JarRolloverMode as JarRolloverModeValue,
} from "@/modules/plan/application/client";
import { calculateJarRuleBudget } from "@/modules/plan/application/jar-budget";
import { TransactionDirection } from "@/modules/ledger/application/ledger-constants";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TextField, CheckboxField } from "@/shared/ui/form";
import { ControlledField } from "@/shared/patterns/controlled-fields";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { AlertVariant } from "@/shared/ui/alert";
import { Text } from "@/shared/ui/text";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { useStatusAlert } from "@/providers/status-alert-provider";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { createJarAction, updateJarConfigurationAction } from "./actions";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

export type JarCategoryFormOption = {
  id: string;
  name: string;
  kind: TransactionDirection;
  jarId: string;
};

export type JarOption = { id: string; name: string };

type Props = {
  mode: "create" | "edit";
  jarId?: string;
  initialName?: string;
  initialKind?: JarKindValue;
  initialEnabled?: boolean;
  initialPlan?: JarPlan | null;
  initialRolloverMode?: JarRolloverModeValue;
  categories: JarCategoryFormOption[];
  availableJars: JarOption[];
  currency: string;
  qualifyingIncome: number | null;
  onCancel?: () => void;
  onSaved?: () => void;
};

/**
 * The form always submits a complete payload, so the canonical schema's
 * server-side defaults become required fields here (same rules, no defaults).
 * `confirmReassignment` is the UI acknowledgement for every conflicting
 * category at once; the submit payload converts it back to the canonical
 * `confirmReassignCategoryIds` list.
 */
const jarConfigurationFormSchema = jarConfigurationInputSchema.safeExtend({
  kind: z.enum(JAR_KIND_VALUES),
  enabled: z.boolean(),
  planKind: z.enum(JAR_PLAN_KIND_VALUES),
  categoryIds: jarCategoryIdsSchema,
  confirmReassignment: z.boolean(),
});

type JarConfigurationFormValues = z.input<typeof jarConfigurationFormSchema>;
type JarConfigurationSubmitValues = z.output<typeof jarConfigurationFormSchema>;

type JarInitialValues = {
  name: string;
  kind: JarKindValue;
  enabled: boolean;
  plan: JarPlan | null;
  rolloverMode: JarRolloverModeValue;
  categoryIds: string[];
};

function categoryKindForJar(kind: JarKindValue): TransactionDirection {
  return kind === JarKind.INCOME
    ? TransactionDirection.INCOME
    : TransactionDirection.EXPENSE;
}

function ownedCategoryIds(
  mode: Props["mode"],
  jarId: string | undefined,
  categories: JarCategoryFormOption[],
): string[] {
  if (mode !== "edit" || !jarId) return [];
  return categories
    .filter((category) => category.jarId === jarId)
    .map((category) => category.id);
}

function createDefaultValues(
  initial: JarInitialValues,
): JarConfigurationFormValues {
  const plan = initial.plan;
  return {
    name: initial.name,
    kind: initial.kind,
    enabled: initial.enabled,
    planKind: plan?.kind ?? JarPlanKind.FIXED,
    percent:
      plan?.kind === JarPlanKind.PERCENT ? plan.percentBps / 100 : undefined,
    fixedAmount:
      plan?.kind === JarPlanKind.FIXED ? plan.fixedAmount : undefined,
    rolloverMode: initial.rolloverMode,
    categoryIds: initial.categoryIds,
    confirmReassignCategoryIds: [],
    confirmReassignment: false,
  };
}

function previewPlan(
  planKind: JarPlanKind,
  percent: number | undefined,
  fixedAmount: number | undefined,
): JarPlan {
  return {
    kind: planKind,
    percentBps:
      planKind === JarPlanKind.PERCENT ? Math.round((percent ?? 0) * 100) : 0,
    fixedAmount: planKind === JarPlanKind.FIXED ? (fixedAmount ?? 0) : 0,
  };
}

type PayloadContext = {
  confirmReassignCategoryIds: string[];
  includeRemovedTarget: boolean;
};

export function jarConfigurationPayload(
  values: JarConfigurationSubmitValues,
  { confirmReassignCategoryIds, includeRemovedTarget }: PayloadContext,
): JarConfigurationInput {
  const removedCategoryTargetJarId = includeRemovedTarget
    ? values.removedCategoryTargetJarId
    : undefined;

  return {
    name: values.name,
    kind: values.kind,
    enabled: values.enabled,
    planKind: values.planKind,
    ...(values.planKind === JarPlanKind.PERCENT
      ? { percent: values.percent }
      : { fixedAmount: values.fixedAmount }),
    rolloverMode: values.rolloverMode,
    categoryIds: values.categoryIds,
    confirmReassignCategoryIds,
    ...(removedCategoryTargetJarId ? { removedCategoryTargetJarId } : {}),
  };
}

const ACTIVE_KIND_OPTIONS = JAR_KIND_VALUES;

function buttonClass(selected: boolean) {
  return selected
    ? "min-h-11 flex-1 rounded-[var(--radius-control)] bg-accent px-(--space-3) text-sm font-medium text-accent-fg shadow-[var(--elevation-1)] transition-[background-color,box-shadow,transform] duration-(--duration-fast) ease-(--ease-standard) active:scale-[0.98] motion-reduce:transition-none"
    : "min-h-11 flex-1 rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary transition-[border-color,background-color,transform] duration-(--duration-fast) ease-(--ease-standard) hover:border-border-strong active:scale-[0.98] motion-reduce:transition-none";
}

/**
 * Jar V2 configuration (create + edit) on React Hook Form + the shared
 * client-safe Jar configuration schema (see the form architecture standard).
 */
export function JarConfigurationForm({
  mode,
  jarId,
  initialName = "",
  initialKind = JarKind.SPENDING,
  initialEnabled = true,
  initialPlan,
  initialRolloverMode = JarRolloverMode.RESET,
  categories,
  availableJars,
  currency,
  qualifyingIncome,
  onCancel,
  onSaved,
}: Props) {
  const t = useTranslations("plan.jars");
  const router = useRouter();
  const nameId = useId();
  const percentId = useId();
  const fixedId = useId();
  const removedTargetId = useId();
  const { online } = useOnlineStatusClient();
  const statusAlert = useStatusAlert();
  const [isPending, startTransition] = useTransition();

  const ownedIds = ownedCategoryIds(mode, jarId, categories);
  const defaultValues = createDefaultValues({
    name: initialName,
    kind: initialKind,
    enabled: initialEnabled,
    plan: initialPlan ?? null,
    rolloverMode: initialRolloverMode,
    categoryIds: ownedIds,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<
    JarConfigurationFormValues,
    unknown,
    JarConfigurationSubmitValues
  >({
    resolver: zodResolver(jarConfigurationFormSchema),
    defaultValues,
  });

  const kind = useWatch({ control, name: "kind" });
  const planKind = useWatch({ control, name: "planKind" });
  const percent = useWatch({ control, name: "percent" });
  const fixedAmount = useWatch({ control, name: "fixedAmount" });
  const rolloverMode = useWatch({ control, name: "rolloverMode" });
  const selectedCategoryIds = useWatch({ control, name: "categoryIds" });

  const expectedCategoryKind = categoryKindForJar(kind);
  const visibleCategories = categories.filter(
    (category) => category.kind === expectedCategoryKind,
  );
  const selectedCategorySet = new Set(selectedCategoryIds);
  const reassignmentConflicts = visibleCategories.filter(
    (category) =>
      selectedCategorySet.has(category.id) && category.jarId !== jarId,
  );
  const removedCategoryIds = ownedIds.filter(
    (categoryId) => !selectedCategorySet.has(categoryId),
  );

  const previewAmount = calculateJarRuleBudget(
    { plan: previewPlan(planKind, percent, fixedAmount) },
    qualifyingIncome ?? 0,
  );

  const handleKindChange = (nextKind: JarKindValue) => {
    setValue("kind", nextKind);
    const nextCategoryKind = categoryKindForJar(nextKind);
    setValue(
      "categoryIds",
      selectedCategoryIds.filter((categoryId) =>
        categories.some(
          (category) =>
            category.id === categoryId && category.kind === nextCategoryKind,
        ),
      ),
    );
    setValue("confirmReassignment", false);
  };

  const handleCategoryToggle = (
    category: JarCategoryFormOption,
    checked: boolean,
  ) => {
    setValue(
      "categoryIds",
      checked
        ? [...selectedCategoryIds, category.id]
        : selectedCategoryIds.filter((id) => id !== category.id),
    );
    if (category.jarId !== jarId) {
      setValue("confirmReassignment", false);
    }
  };

  const showConfigError = (code: ErrorCode) => {
    statusAlert.show({
      variant: AlertVariant.DANGER,
      title: t(mode === "create" ? "create" : "editJar"),
      description: t(`errors.${code}`),
    });
  };

  const onSubmit = handleSubmit((values) => {
    statusAlert.hide();
    if (!online) {
      showConfigError(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }

    const needsReassignConfirmation =
      reassignmentConflicts.length > 0 && !values.confirmReassignment;
    const needsRemovedTarget =
      removedCategoryIds.length > 0 && !values.removedCategoryTargetJarId;
    if (needsReassignConfirmation || needsRemovedTarget) {
      showConfigError(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }

    const input = jarConfigurationPayload(values, {
      confirmReassignCategoryIds: reassignmentConflicts.map(
        (category) => category.id,
      ),
      includeRemovedTarget: removedCategoryIds.length > 0,
    });

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createJarAction(input)
          : await updateJarConfigurationAction(jarId ?? "", input);
      if (result.status === "success") {
        if (mode === "create") {
          reset(defaultValues);
        }
        onSaved?.();
        router.refresh();
        return;
      }
      showConfigError(result.code);
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-(--space-4) rounded-[var(--radius-card)] border border-border-subtle bg-surface p-(--space-4) shadow-[var(--elevation-1)]"
      data-testid={mode === "create" ? "jar-create-form" : "jar-edit-form"}
    >
      <div className="flex flex-col gap-(--space-3)">
        <div>
          <Text size="lg" className="font-semibold text-text-primary">
            {t(mode === "create" ? "createHeading" : "editHeading")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("configurationIntro")}
          </Text>
        </div>
        <TextField
          id={nameId}
          label={t("createNameLabel")}
          placeholder={t("createNamePlaceholder")}
          autoComplete="off"
          registration={register("name")}
          error={errors.name ? t("errors.name_invalid") : undefined}
        />
        <CheckboxField
          id={`${nameId}-enabled`}
          label={
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-text-primary">
                {t("enabledLabel")}
              </span>
              <span className="text-xs text-text-secondary">
                {t("enabledHint")}
              </span>
            </span>
          }
          {...register("enabled")}
        />
      </div>

      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("planKindLabel")}
        </legend>
        <Text size="sm" tone="secondary">
          {t("allocationMeaning")}
        </Text>
        <div className="flex gap-(--space-2)">
          <button
            type="button"
            data-testid={`${mode === "create" ? "jar-create" : "jar-edit"}-plan-percent`}
            aria-pressed={planKind === JarPlanKind.PERCENT}
            className={buttonClass(planKind === JarPlanKind.PERCENT)}
            onClick={() => setValue("planKind", JarPlanKind.PERCENT)}
          >
            {t("planKindPercent")}
          </button>
          <button
            type="button"
            data-testid={`${mode === "create" ? "jar-create" : "jar-edit"}-plan-fixed`}
            aria-pressed={planKind === JarPlanKind.FIXED}
            className={buttonClass(planKind === JarPlanKind.FIXED)}
            onClick={() => setValue("planKind", JarPlanKind.FIXED)}
          >
            {t("planKindFixed")}
          </button>
        </div>
      </fieldset>

      {planKind === JarPlanKind.PERCENT ? (
        <TextField
          id={percentId}
          label={t("percentLabel")}
          inputMode="decimal"
          description={t("percentHint")}
          registration={register("percent", { valueAsNumber: true })}
          error={errors.percent ? t("errors.percent_invalid") : undefined}
        />
      ) : (
        <ControlledField
          control={control}
          field={{
            type: "amount",
            name: "fixedAmount",
            id: fixedId,
            label: t("fixedLabel"),
            description: t("fixedHint"),
            emptyValue: undefined,
            error: errors.fixedAmount ? t("errors.fixed_invalid") : undefined,
          }}
        />
      )}

      <StatusAlert
        variant={AlertVariant.INFO}
        title={t("previewTitle")}
        description={
          qualifyingIncome == null
            ? t("previewNoIncome")
            : t("previewAmount", {
                amount: formatCurrency(previewAmount, currency, "vi-VN", {
                  maximumFractionDigits: 0,
                }),
              })
        }
      />

      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-semibold text-text-primary">
          {t("categoriesHeading")}
        </legend>
        <Text size="sm" tone="secondary">
          {t("categoriesHint")}
        </Text>
        {visibleCategories.length === 0 ? (
          <Text size="sm" tone="secondary">
            {t("categoriesEmpty")}
          </Text>
        ) : (
          <div className="flex flex-col gap-(--space-2)">
            {visibleCategories.map((category) => (
              <CheckboxField
                key={category.id}
                id={`${nameId}-${category.id}`}
                checked={selectedCategorySet.has(category.id)}
                onChange={(event) =>
                  handleCategoryToggle(category, event.target.checked)
                }
                label={
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-(--space-2)">
                    <span className="truncate text-text-primary">
                      {category.name}
                    </span>
                    {category.jarId !== jarId ? (
                      <span className="shrink-0 text-xs text-text-secondary">
                        {t("categoryMappedElsewhere")}
                      </span>
                    ) : null}
                  </span>
                }
              />
            ))}
          </div>
        )}
      </fieldset>

      {reassignmentConflicts.length > 0 ? (
        <div className="rounded-[var(--radius-control)] border border-border-subtle bg-surface-subtle p-(--space-3)">
          <CheckboxField
            id={`${nameId}-confirm-reassignment`}
            label={t("confirmReassignment", {
              count: reassignmentConflicts.length,
            })}
            {...register("confirmReassignment")}
          />
        </div>
      ) : null}

      {removedCategoryIds.length > 0 ? (
        <div className="flex flex-col gap-(--space-2) rounded-[var(--radius-control)] border border-border-subtle bg-surface-subtle p-(--space-3)">
          <Text size="sm" className="font-medium text-text-primary">
            {t("removedCategoriesHeading")}
          </Text>
          <Text size="sm" tone="secondary">
            {t("removedCategoriesHint")}
          </Text>
          <ControlledField
            control={control}
            field={{
              type: "select",
              name: "removedCategoryTargetJarId",
              id: removedTargetId,
              label: t("removedCategoriesTargetLabel"),
              options: availableJars.map((jar) => ({
                id: jar.id,
                label: jar.name,
              })),
            }}
          />
        </div>
      ) : null}

      <details className="group rounded-[var(--radius-control)] border border-border-subtle bg-surface-subtle p-(--space-3)">
        <summary className="cursor-pointer list-none text-sm font-semibold text-text-primary marker:hidden">
          <span className="flex items-center justify-between gap-(--space-2)">
            {t("moreOptions")}
            <span
              aria-hidden
              className="text-text-secondary transition-transform group-open:rotate-180 motion-reduce:transition-none"
            >
              ⌄
            </span>
          </span>
        </summary>
        <div className="mt-(--space-3) flex flex-col gap-(--space-3)">
          <fieldset className="flex flex-col gap-(--space-2)">
            <legend className="text-sm font-semibold text-text-primary">
              {t("typeLabel")}
            </legend>
            <Text size="sm" tone="secondary">
              {t("typeHint")}
            </Text>
            <div className="grid grid-cols-2 gap-(--space-2)">
              {ACTIVE_KIND_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={kind === option}
                  className={buttonClass(kind === option)}
                  onClick={() => handleKindChange(option)}
                >
                  <span className="block">{t(`kinds.${option}`)}</span>
                  <span className="mt-1 block text-xs opacity-80">
                    {t(`kindDescriptions.${option}`)}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-(--space-2)">
            <legend className="text-sm font-semibold text-text-primary">
              {t("rolloverLabel")}
            </legend>
            <div className="flex gap-(--space-2)">
              <button
                type="button"
                data-testid={`${mode === "create" ? "jar-create" : "jar-edit"}-rollover-reset`}
                aria-pressed={rolloverMode === JarRolloverMode.RESET}
                className={buttonClass(rolloverMode === JarRolloverMode.RESET)}
                onClick={() => setValue("rolloverMode", JarRolloverMode.RESET)}
              >
                {t("rolloverReset")}
              </button>
              <button
                type="button"
                data-testid={`${mode === "create" ? "jar-create" : "jar-edit"}-rollover-carry`}
                aria-pressed={rolloverMode === JarRolloverMode.CARRY}
                className={buttonClass(rolloverMode === JarRolloverMode.CARRY)}
                onClick={() => setValue("rolloverMode", JarRolloverMode.CARRY)}
              >
                {t("rolloverCarry")}
              </button>
            </div>
            <Text size="sm" tone="secondary">
              {t("rolloverHint")}
            </Text>
          </fieldset>
        </div>
      </details>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        data-testid={mode === "create" ? "jar-create-submit" : "jar-plan-edit"}
        isDisabled={isPending || !online}
      >
        {t(mode === "create" ? "createSubmit" : "saveChanges")}
      </Button>
      {onCancel ? (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          isDisabled={isPending}
          onPress={onCancel}
        >
          {t("createCancel")}
        </Button>
      ) : null}
    </form>
  );
}
