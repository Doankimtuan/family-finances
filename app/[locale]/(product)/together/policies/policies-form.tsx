"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { SectionHeader } from "@/shared/patterns/section-header";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import type {
  HouseholdPoliciesInput,
  IncomeAllocateMode,
  MonthCloseMode,
  OverspendPolicy,
} from "@/modules/tenancy/application/household-policies.schema";
import type { PolicyEventRow } from "@/modules/tenancy/application/list-policy-events";
import type { UpdatePoliciesActionState } from "./actions";
import { updatePoliciesAction } from "./actions";

type PoliciesFormErrorCode = Extract<
  UpdatePoliciesActionState,
  { status: "error" }
>["code"];

function RadioOption<T extends string>({
  name,
  value,
  checked,
  label,
  hint,
  disabled,
  onChange,
}: {
  name: string;
  value: T;
  checked: boolean;
  label: string;
  hint: string;
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-(--space-3) rounded-lg border border-border-subtle bg-surface px-(--space-4) py-(--space-3) ${
        disabled ? "cursor-not-allowed opacity-70" : ""
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="mt-1 size-4 accent-(--color-accent)"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-xs text-text-secondary">{hint}</span>
      </span>
    </label>
  );
}

/**
 * Policies form — overspend / ritual / income allocation (AC-007 / AC-009 / AC-013).
 */
export function PoliciesForm({
  initial,
  events,
}: {
  initial: HouseholdPoliciesInput & { canEdit: boolean };
  events: PolicyEventRow[];
}) {
  const t = useTranslations("together.policies");
  const locale = useLocale();
  const router = useRouter();
  const [overspend, setOverspend] = useState<OverspendPolicy>(
    initial.overspendPolicy,
  );
  const [monthClose, setMonthClose] = useState<MonthCloseMode>(
    initial.monthCloseMode,
  );
  const [income, setIncome] = useState<IncomeAllocateMode>(
    initial.incomeAllocateMode,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorCode, setErrorCode] = useState<PoliciesFormErrorCode | null>(
    null,
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dirty =
    overspend !== initial.overspendPolicy ||
    monthClose !== initial.monthCloseMode ||
    income !== initial.incomeAllocateMode;

  const onConfirmSave = () => {
    setErrorCode(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updatePoliciesAction({
        overspendPolicy: overspend,
        monthCloseMode: monthClose,
        incomeAllocateMode: income,
      });
      setConfirmOpen(false);
      if (result.status === "success") {
        setSaved(true);
        router.refresh();
        return;
      }
      setErrorCode(result.code);
    });
  };

  return (
    <div
      className="flex flex-col gap-(--space-5)"
      data-testid="together-policies"
    >
      {!initial.canEdit ? (
        <StatusAlert
          variant="info"
          title={t("readOnlyTitle")}
          description={t("readOnlyBody")}
        />
      ) : null}

      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("errorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      {saved ? (
        <StatusAlert
          variant="success"
          title={t("savedTitle")}
          description={t("savedBody")}
        />
      ) : null}

      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader
          title={t("overspendTitle")}
          description={t("overspendDescription")}
        />
        {(
          [
            ["warn", "overspendWarn", "overspendWarnHint"],
            ["block", "overspendBlock", "overspendBlockHint"],
            ["allow_negative", "overspendAllow", "overspendAllowHint"],
          ] as const
        ).map(([value, labelKey, hintKey]) => (
          <RadioOption
            key={value}
            name="overspend"
            value={value}
            checked={overspend === value}
            label={t(labelKey)}
            hint={t(hintKey)}
            disabled={!initial.canEdit || isPending}
            onChange={setOverspend}
          />
        ))}
      </section>

      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader
          title={t("ritualTitle")}
          description={t("ritualDescription")}
        />
        {(
          [
            ["assisted", "ritualAssisted", "ritualAssistedHint"],
            ["auto", "ritualAuto", "ritualAutoHint"],
            ["manual", "ritualManual", "ritualManualHint"],
          ] as const
        ).map(([value, labelKey, hintKey]) => (
          <RadioOption
            key={value}
            name="monthClose"
            value={value}
            checked={monthClose === value}
            label={t(labelKey)}
            hint={t(hintKey)}
            disabled={!initial.canEdit || isPending}
            onChange={setMonthClose}
          />
        ))}
      </section>

      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader
          title={t("incomeTitle")}
          description={t("incomeDescription")}
        />
        {(
          [
            ["suggest", "incomeSuggest", "incomeSuggestHint"],
            ["auto", "incomeAuto", "incomeAutoHint"],
            ["off", "incomeOff", "incomeOffHint"],
          ] as const
        ).map(([value, labelKey, hintKey]) => (
          <RadioOption
            key={value}
            name="income"
            value={value}
            checked={income === value}
            label={t(labelKey)}
            hint={t(hintKey)}
            disabled={!initial.canEdit || isPending}
            onChange={setIncome}
          />
        ))}
      </section>

      <section className="flex flex-col gap-(--space-2)">
        <SectionHeader
          title={t("auditTitle")}
          description={t("auditDescription")}
        />
        {events.length === 0 ? (
          <Text size="sm" tone="secondary">
            {t("auditEmpty")}
          </Text>
        ) : (
          <ul className="flex flex-col gap-(--space-2)">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface px-(--space-4) py-(--space-3)"
              >
                <Text size="sm" className="font-medium text-text-primary">
                  {t("auditEvent")}
                </Text>
                <Text size="sm" tone="secondary">
                  {new Date(event.createdAt).toLocaleString(locale)}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </section>

      {initial.canEdit ? (
        confirmOpen ? (
          <div
            className="flex flex-col gap-(--space-3) rounded-[var(--radius-lg)] border border-border-subtle bg-surface p-(--space-4)"
            data-testid="policies-confirm"
          >
            <Text size="sm" className="font-semibold text-text-primary">
              {t("confirmTitle")}
            </Text>
            <Text size="sm" tone="secondary">
              {t("confirmBody")}
            </Text>
            <Button
              variant="primary"
              className="w-full"
              data-testid="policies-confirm-save"
              isDisabled={isPending}
              onPress={onConfirmSave}
            >
              {isPending ? t("saving") : t("confirmSave")}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              isDisabled={isPending}
              onPress={() => setConfirmOpen(false)}
            >
              {t("cancel")}
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            data-testid="policies-save"
            isDisabled={!dirty || isPending}
            onPress={() => {
              setSaved(false);
              setErrorCode(null);
              setConfirmOpen(true);
            }}
          >
            {t("save")}
          </Button>
        )
      ) : null}
    </div>
  );
}
