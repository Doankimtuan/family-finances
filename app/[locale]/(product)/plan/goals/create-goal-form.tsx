"use client";
import { useId, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { planGoalPath } from "@/modules/tenancy/application/app-path";
import { TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import { Button } from "@/shared/ui/button";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { formatCurrency } from "@/shared/i18n/formatters";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import {
  GOAL_TYPE_VALUES,
  type GoalType,
} from "@/modules/plan/application/client";
import type { GoalFundingOption } from "@/modules/plan/application/queries/list-goal-funding-options";
import { goalFundingSourceKey } from "@/modules/plan/application/goal-funding";
import { createGoalAction, linkGoalFundingAction } from "./actions";

type ErrorCode = ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;
type Props = { fundingOptions: GoalFundingOption[] };
const SOURCE_GROUPS = ["savings", "investments", "debt"] as const;

export function CreateGoalForm({ fundingOptions }: Props) {
  const t = useTranslations("plan.goals");
  const locale = useLocale();
  const router = useRouter();
  const nameId = useId();
  const targetId = useId();
  const dateId = useId();
  const { online } = useOnlineStatusClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState<number | null>(null);
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [targetDate, setTargetDate] = useState("");
  const [selectedSourceKey, setSelectedSourceKey] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const compatibleOptions = goalType
    ? fundingOptions.filter((option) =>
        goalType === "payoff"
          ? option.sourceType === "debt"
          : option.sourceType !== "debt",
      )
    : [];
  const selectedSource = compatibleOptions.find(
    (option) => goalFundingSourceKey(option) === selectedSourceKey,
  );

  const onSubmit = () => {
    setErrorCode(null);
    if (!online) {
      setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
      return;
    }
    if (target == null || target <= 0 || goalType == null) return;
    startTransition(async () => {
      const result = await createGoalAction({
        name: name.trim(),
        targetAmount: target,
        goalType,
        targetDate: targetDate || null,
      });
      if (result.status !== "success") {
        setErrorCode(result.code);
        return;
      }
      if (selectedSource?.isAvailable) {
        const linkResult = await linkGoalFundingAction({
          goalId: result.goalId,
          sourceKind: selectedSource.kind,
          sourceId: selectedSource.sourceId,
        });
        if (linkResult.status !== "success") {
          setErrorCode(linkResult.code);
          router.push(planGoalPath(result.goalId));
          return;
        }
      }
      setOpen(false);
      setName("");
      setTarget(null);
      setGoalType(null);
      setTargetDate("");
      setSelectedSourceKey(null);
      router.push(planGoalPath(result.goalId));
    });
  };

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="w-full"
        data-testid="goal-create-open"
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
        {online ? t("create") : t("errors.offline")}
      </Button>
    );
  }

  return (
    <div
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
      data-testid="goal-create-form"
    >
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("create")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}
      <TextField
        id={nameId}
        label={t("createNameLabel")}
        placeholder={t("createNamePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <AmountField
        id={targetId}
        label={t("createTargetLabel")}
        value={target}
        onValueChange={setTarget}
      />
      <fieldset className="flex flex-col gap-(--space-2)">
        <legend className="text-sm font-medium text-text-primary">
          {t("createTypeLabel")}
        </legend>
        <div className="grid grid-cols-3 gap-(--space-2)">
          {GOAL_TYPE_VALUES.map((value) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-2) text-center text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/10"
            >
              <input
                type="radio"
                name="goal-type"
                value={value}
                checked={goalType === value}
                onChange={() => {
                  setGoalType(value);
                  setSelectedSourceKey(null);
                }}
                className="sr-only"
              />
              {t(`type.${value}`)}
            </label>
          ))}
        </div>
      </fieldset>
      <TextField
        id={dateId}
        label={t("createDateLabel")}
        type="date"
        value={targetDate}
        onChange={(e) => setTargetDate(e.target.value)}
      />
      {goalType ? (
        <fieldset className="flex flex-col gap-(--space-2)">
          <legend className="text-sm font-medium text-text-primary">
            {t("createFundingLabel")}
          </legend>
          <p className="text-xs text-text-secondary">{t("createFundingHint")}</p>
          {SOURCE_GROUPS.map((group) => {
            const options = compatibleOptions.filter(
              (option) => option.sourceType === group,
            );
            if (options.length === 0) return null;
            return (
              <div key={group} className="flex flex-col gap-(--space-2)">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  {t(`fundingGroup.${group}`)}
                </p>
                {options.map((option) => {
                  const key = goalFundingSourceKey(option);
                  const unavailable = !option.isAvailable;
                  return (
                    <label
                      key={key}
                      className={`flex min-h-11 items-center gap-(--space-3) rounded-[var(--radius-control)] border border-border-subtle px-(--space-3) ${unavailable ? "cursor-not-allowed opacity-60" : "cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent/10"}`}
                    >
                      <input
                        type="radio"
                        name="goal-funding-source"
                        value={key}
                        checked={selectedSourceKey === key}
                        disabled={unavailable}
                        onChange={() => setSelectedSourceKey(key)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {option.name}
                        </span>
                        <span className="block text-xs text-text-secondary">
                          {unavailable
                            ? t("fundingAlreadyLinked")
                            : formatCurrency(
                                option.currentAmount,
                                option.currency ?? "VND",
                                locale,
                                { maximumFractionDigits: 0 },
                              )}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            );
          })}
          <p className="text-xs text-text-secondary">{t("createFundingOptional")}</p>
        </fieldset>
      ) : null}
      <Button
        variant="primary"
        className="w-full"
        data-testid="goal-create-submit"
        isDisabled={
          isPending ||
          !online ||
          name.trim().length < 2 ||
          target == null ||
          target <= 0 ||
          goalType == null
        }
        onPress={onSubmit}
      >
        {t("createSubmit")}
      </Button>
      <Button
        variant="secondary"
        className="w-full"
        isDisabled={isPending}
        onPress={() => {
          setOpen(false);
          setSelectedSourceKey(null);
        }}
      >
        {t("createCancel")}
      </Button>
    </div>
  );
}
