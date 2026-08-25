"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { HOUSEHOLD_ERROR_CODE } from "@/modules/tenancy/application/tenancy-constants";
import { SectionHeader } from "@/shared/patterns/section-header";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { ChoiceTile } from "@/shared/patterns/choice-tile";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import type {
  HouseholdPoliciesInput,
  IncomeAllocateMode,
  MonthCloseMode,
  OverspendPolicy,
} from "@/modules/tenancy/application/household-policies.schema";
import { OverspendPolicy as OverspendPolicyConst } from "@/modules/tenancy/application/household-policies.schema";
import {
  IncomeAllocateMode as IncomeAllocateModeConst,
  RitualMode,
} from "@/modules/plan/application/client";
import type { PolicyEventRow } from "@/modules/tenancy/application/list-policy-events";
import type { UpdatePoliciesActionState } from "./actions";
import { updatePoliciesAction } from "./actions";

type PoliciesFormErrorCode = Extract<
  UpdatePoliciesActionState,
  { status: "error" }
>["code"];

function ChoiceOption<T extends string>({
  value,
  checked,
  label,
  hint,
  disabled,
  onChange,
}: {
  value: T;
  checked: boolean;
  label: string;
  hint: string;
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <ChoiceTile
      role="radio"
      selected={checked}
      isDisabled={disabled}
      onPress={() => onChange(value)}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <Text size="sm" weight="medium">
          {label}
        </Text>
        <Text size="xs" tone="secondary" className="text-pretty">
          {hint}
        </Text>
      </span>
    </ChoiceTile>
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
  const tPermission = useTranslations("system.permission");
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
      if (result.code === HOUSEHOLD_ERROR_CODE.FORBIDDEN) {
        router.push(`${APP_PATH.PERMISSION}?reason=admin`);
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
        <div data-testid="policies-readonly">
          <StatusAlert
            variant="info"
            title={t("readOnlyTitle")}
            description={t("readOnlyBody")}
          />
          <Link
            href={`${APP_PATH.PERMISSION}?reason=admin`}
            className="mt-(--space-2) inline-flex min-h-11 items-center text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            data-testid="policies-permission-link"
          >
            {tPermission("learnRoles")}
          </Link>
        </div>
      ) : null}

      <div data-testid="policies-money-none">
        <StatusAlert
          variant="info"
          title={t("moneyNoneTitle")}
          description={t("moneyNoneBody")}
        />
      </div>

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
            [OverspendPolicyConst.WARN, "overspendWarn", "overspendWarnHint"],
            [
              OverspendPolicyConst.BLOCK,
              "overspendBlock",
              "overspendBlockHint",
            ],
            [
              OverspendPolicyConst.ALLOW_NEGATIVE,
              "overspendAllow",
              "overspendAllowHint",
            ],
          ] as const
        ).map(([value, labelKey, hintKey]) => (
          <ChoiceOption
            key={value}
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
            [RitualMode.ASSISTED, "ritualAssisted", "ritualAssistedHint"],
            [RitualMode.MANUAL, "ritualManual", "ritualManualHint"],
          ] as const
        ).map(([value, labelKey, hintKey]) => (
          <ChoiceOption
            key={value}
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
            [
              IncomeAllocateModeConst.SUGGEST,
              "incomeSuggest",
              "incomeSuggestHint",
            ],
            [IncomeAllocateModeConst.AUTO, "incomeAuto", "incomeAutoHint"],
            [IncomeAllocateModeConst.OFF, "incomeOff", "incomeOffHint"],
          ] as const
        ).map(([value, labelKey, hintKey]) => (
          <ChoiceOption
            key={value}
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
                className="rounded-lg border border-border-subtle bg-surface px-(--space-4) py-(--space-3)"
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
        <>
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
          <Sheet
            isOpen={confirmOpen}
            onOpenChange={(open) => {
              if (!isPending) setConfirmOpen(open);
            }}
          >
            <ActionSheetLayout>
              <ActionSheetLayout.Header>
                <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
                  {t("confirmTitle")}
                </Sheet.Heading>
              </ActionSheetLayout.Header>
              <ActionSheetLayout.Body>
                <div
                  className="flex flex-col gap-(--space-3)"
                  data-testid="policies-confirm"
                >
                  <Text size="sm" tone="secondary" className="text-pretty">
                    {t("confirmBody")}
                  </Text>
                  <Text
                    size="sm"
                    tone="secondary"
                    className="text-pretty"
                    data-testid="policies-confirm-money-none"
                  >
                    {t("confirmMoneyNone")}
                  </Text>
                </div>
              </ActionSheetLayout.Body>
              <SheetActionFooter
                secondaryLabel={t("cancel")}
                primaryLabel={isPending ? t("saving") : t("confirmSave")}
                onSecondary={() => setConfirmOpen(false)}
                onPrimary={onConfirmSave}
                primaryTestId="policies-confirm-save"
                isPending={isPending}
              />
            </ActionSheetLayout>
          </Sheet>
        </>
      ) : null}
    </div>
  );
}
