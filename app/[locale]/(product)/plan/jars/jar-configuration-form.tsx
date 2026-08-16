"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  JarKind,
  JarPlanKind,
  JarRolloverMode,
  JAR_KIND_VALUES,
  type JarPlan,
  type JarKind as JarKindValue,
  type JarRolloverMode as JarRolloverModeValue,
} from "@/modules/plan/application/client";
import { calculateJarRuleBudget } from "@/modules/plan/application/jar-budget";
import { formatCurrency } from "@/shared/i18n/formatters";
import { TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import { Button } from "@/shared/ui/button";
import { CheckboxField } from "@/shared/ui/form";
import { Select } from "@/shared/ui/select";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import {
  CLIENT_ACTION_ERROR_CODE,
  PRODUCT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  createJarAction,
  updateJarConfigurationAction,
} from "./actions";

export type JarCategoryFormOption = {
  id: string;
  name: string;
  kind: "income" | "expense";
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

type ErrorCode = ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;

const ACTIVE_KIND_OPTIONS = JAR_KIND_VALUES;

function categoryKindForJar(kind: JarKindValue): "income" | "expense" {
  return kind === JarKind.INCOME ? "income" : "expense";
}

function buttonClass(selected: boolean) {
  return selected
    ? "min-h-11 flex-1 rounded-[var(--radius-control)] bg-accent px-(--space-3) text-sm font-medium text-accent-fg shadow-[var(--elevation-1)] transition-[background-color,box-shadow,transform] duration-(--duration-fast) ease-(--ease-standard) active:scale-[0.98] motion-reduce:transition-none"
    : "min-h-11 flex-1 rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-3) text-sm font-medium text-text-primary transition-[border-color,background-color,transform] duration-(--duration-fast) ease-(--ease-standard) hover:border-border-strong active:scale-[0.98] motion-reduce:transition-none";
}

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
  const [name, setName] = useState(initialName);
  const [kind, setKind] = useState<JarKindValue>(initialKind);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [planKind, setPlanKind] = useState<JarPlanKind>(
    initialPlan?.kind ?? JarPlanKind.FIXED,
  );
  const [percent, setPercent] = useState(
    initialPlan ? String(initialPlan.percentBps / 100) : "",
  );
  const [fixedAmount, setFixedAmount] = useState<number | null>(
    initialPlan?.fixedAmount ?? null,
  );
  const [rolloverMode, setRolloverMode] = useState(initialRolloverMode);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    mode === "edit" && jarId
      ? categories.filter((category) => category.jarId === jarId).map((category) => category.id)
      : [],
  );
  const [removedCategoryTargetJarId, setRemovedCategoryTargetJarId] = useState("");
  const [confirmReassignment, setConfirmReassignment] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  const expectedCategoryKind = categoryKindForJar(kind);
  const visibleCategories = categories.filter(
    (category) => category.kind === expectedCategoryKind,
  );
  const selectedSet = useMemo(() => new Set(selectedCategoryIds), [selectedCategoryIds]);
  const conflicts = visibleCategories.filter(
    (category) => selectedSet.has(category.id) && category.jarId !== jarId,
  );
  const currentCategoryIds =
    mode === "edit" && jarId
      ? categories.filter((category) => category.jarId === jarId).map((category) => category.id)
      : [];
  const removedCategoryIds = currentCategoryIds.filter(
    (categoryId) => !selectedSet.has(categoryId),
  );

  const previewAmount = useMemo(() => {
    const plan: JarPlan = {
      kind: planKind,
      percentBps: planKind === JarPlanKind.PERCENT ? Math.round(Number(percent) * 100) : 0,
      fixedAmount: planKind === JarPlanKind.FIXED ? fixedAmount ?? 0 : 0,
    };
    return calculateJarRuleBudget({ plan }, qualifyingIncome ?? 0);
  }, [fixedAmount, percent, planKind, qualifyingIncome]);

  const setJarKind = (nextKind: JarKindValue) => {
    setKind(nextKind);
    const nextCategoryKind = categoryKindForJar(nextKind);
    setSelectedCategoryIds((current) =>
      current.filter((categoryId) =>
        categories.some(
          (category) => category.id === categoryId && category.kind === nextCategoryKind,
        ),
      ),
    );
    setConfirmReassignment(false);
  };

  const onSubmit = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    const numericPercent = Number(percent);
    if (name.trim().length < 2 || (planKind === JarPlanKind.FIXED && (fixedAmount == null || fixedAmount <= 0)) || (planKind === JarPlanKind.PERCENT && (!Number.isFinite(numericPercent) || numericPercent <= 0 || numericPercent > 100))) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    if (conflicts.length > 0 && !confirmReassignment) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }
    if (removedCategoryIds.length > 0 && !removedCategoryTargetJarId) {
      setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
      return;
    }

    const input = {
      name: name.trim(),
      kind,
      enabled,
      planKind,
      ...(planKind === JarPlanKind.PERCENT
        ? { percent: numericPercent }
        : { fixedAmount: fixedAmount ?? 0 }),
      rolloverMode,
      categoryIds: selectedCategoryIds,
      confirmReassignCategoryIds: confirmReassignment
        ? conflicts.map((category) => category.id)
        : [],
      ...(removedCategoryTargetJarId
        ? { removedCategoryTargetJarId }
        : {}),
    } as const;

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createJarAction(input)
          : await updateJarConfigurationAction(jarId ?? "", input);
      if (result.status === "success") {
        onSaved?.();
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  return (
    <div
      className="flex flex-col gap-(--space-4) rounded-[var(--radius-card)] border border-border-subtle bg-surface p-(--space-4) shadow-[var(--elevation-1)]"
      data-testid={mode === "create" ? "jar-create-form" : "jar-edit-form"}
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t(mode === "create" ? "create" : "editJar")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

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
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
        />
        <CheckboxField
          id={`${nameId}-enabled`}
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          label={
            <span className="flex flex-col gap-0.5">
              <span className="font-medium text-text-primary">{t("enabledLabel")}</span>
              <span className="text-xs text-text-secondary">{t("enabledHint")}</span>
            </span>
          }
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
            onClick={() => setPlanKind(JarPlanKind.PERCENT)}
          >
            {t("planKindPercent")}
          </button>
          <button
            type="button"
            data-testid={`${mode === "create" ? "jar-create" : "jar-edit"}-plan-fixed`}
            aria-pressed={planKind === JarPlanKind.FIXED}
            className={buttonClass(planKind === JarPlanKind.FIXED)}
            onClick={() => setPlanKind(JarPlanKind.FIXED)}
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
          value={percent}
          onChange={(event) => setPercent(event.target.value)}
          description={t("percentHint")}
        />
      ) : (
        <AmountField
          id={fixedId}
          label={t("fixedLabel")}
          value={fixedAmount}
          onValueChange={setFixedAmount}
          description={t("fixedHint")}
        />
      )}

      <StatusAlert
        variant="info"
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
          <Text size="sm" tone="secondary">{t("categoriesEmpty")}</Text>
        ) : (
          <div className="flex flex-col gap-(--space-2)">
            {visibleCategories.map((category) => (
              <CheckboxField
                key={category.id}
                id={`${nameId}-${category.id}`}
                checked={selectedSet.has(category.id)}
                onChange={(event) => {
                  setSelectedCategoryIds((current) =>
                    event.target.checked
                      ? [...current, category.id]
                      : current.filter((id) => id !== category.id),
                  );
                  if (category.jarId !== jarId) setConfirmReassignment(false);
                }}
                label={
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-(--space-2)">
                    <span className="truncate text-text-primary">{category.name}</span>
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

      {conflicts.length > 0 ? (
        <div className="rounded-[var(--radius-control)] border border-border-subtle bg-surface-subtle p-(--space-3)">
          <CheckboxField
            id={`${nameId}-confirm-reassignment`}
            checked={confirmReassignment}
            onChange={(event) => setConfirmReassignment(event.target.checked)}
            label={t("confirmReassignment", { count: conflicts.length })}
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
          <Select
            id={removedTargetId}
            selectedKey={removedCategoryTargetJarId || null}
            aria-label={t("removedCategoriesTargetLabel")}
            onSelectionChange={(key) => setRemovedCategoryTargetJarId(key ? String(key) : "")}
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <Select.ListBox>
                {availableJars.map((jar) => (
                  <Select.ListBox.Item key={jar.id} id={jar.id} textValue={jar.name}>
                    {jar.name}
                  </Select.ListBox.Item>
                ))}
              </Select.ListBox>
            </Select.Popover>
          </Select>
        </div>
      ) : null}

      <details className="group rounded-[var(--radius-control)] border border-border-subtle bg-surface-subtle p-(--space-3)">
        <summary className="cursor-pointer list-none text-sm font-semibold text-text-primary marker:hidden">
          <span className="flex items-center justify-between gap-(--space-2)">
            {t("moreOptions")}
            <span aria-hidden className="text-text-secondary transition-transform group-open:rotate-180 motion-reduce:transition-none">⌄</span>
          </span>
        </summary>
        <div className="mt-(--space-3) flex flex-col gap-(--space-3)">
          <fieldset className="flex flex-col gap-(--space-2)">
            <legend className="text-sm font-semibold text-text-primary">{t("typeLabel")}</legend>
            <Text size="sm" tone="secondary">{t("typeHint")}</Text>
            <div className="grid grid-cols-2 gap-(--space-2)">
              {ACTIVE_KIND_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={kind === option}
                  className={buttonClass(kind === option)}
                  onClick={() => setJarKind(option)}
                >
                  <span className="block">{t(`kinds.${option}`)}</span>
                  <span className="mt-1 block text-xs opacity-80">{t(`kindDescriptions.${option}`)}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-(--space-2)">
            <legend className="text-sm font-semibold text-text-primary">{t("rolloverLabel")}</legend>
            <div className="flex gap-(--space-2)">
              <button type="button" data-testid={`${mode === "create" ? "jar-create" : "jar-edit"}-rollover-reset`} aria-pressed={rolloverMode === JarRolloverMode.RESET} className={buttonClass(rolloverMode === JarRolloverMode.RESET)} onClick={() => setRolloverMode(JarRolloverMode.RESET)}>{t("rolloverReset")}</button>
              <button type="button" data-testid={`${mode === "create" ? "jar-create" : "jar-edit"}-rollover-carry`} aria-pressed={rolloverMode === JarRolloverMode.CARRY} className={buttonClass(rolloverMode === JarRolloverMode.CARRY)} onClick={() => setRolloverMode(JarRolloverMode.CARRY)}>{t("rolloverCarry")}</button>
            </div>
            <Text size="sm" tone="secondary">{t("rolloverHint")}</Text>
          </fieldset>
        </div>
      </details>

      <Button
        variant="primary"
        className="w-full"
        data-testid={mode === "create" ? "jar-create-submit" : "jar-plan-edit"}
        isDisabled={isPending || !online}
        onPress={onSubmit}
      >
        {t(mode === "create" ? "createSubmit" : "saveChanges")}
      </Button>
      {onCancel ? (
        <Button variant="secondary" className="w-full" isDisabled={isPending} onPress={onCancel}>
          {t("createCancel")}
        </Button>
      ) : null}
    </div>
  );
}
