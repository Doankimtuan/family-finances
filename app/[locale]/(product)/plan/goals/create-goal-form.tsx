"use client";
import { useId, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { planGoalPath } from "@/modules/tenancy/application/app-path";
import { DatePickerField, TextField } from "@/shared/ui/form";
import { AmountField } from "@/shared/patterns/amount-field";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { StatusAlert } from "@/shared/ui/status-alert";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { SheetActionFooter } from "@/shared/patterns/sheet-action-footer";
import { Sheet } from "@/shared/patterns/sheet";
import { ChoiceTile, ChoiceTileGroup } from "@/shared/patterns/choice-tile";
import {
  CLIENT_ACTION_ERROR_CODE,
  type ProductActionErrorCode,
} from "@/modules/tenancy/application/product-action-error";
import { GOAL_TYPE_VALUES, GoalType } from "@/modules/plan/application/client";
import { GoalFundingSourceType } from "@/modules/plan/application/plan-constants";
import type { GoalFundingOption } from "@/modules/plan/application/queries/list-goal-funding-options";
import { goalFundingSourceKey } from "@/modules/plan/application/goal-funding";
import { createGoalAction, linkGoalFundingAction } from "./actions";
import { GoalFundingSourcePicker } from "./goal-funding-source-picker";

type ErrorCode =
  ProductActionErrorCode | typeof CLIENT_ACTION_ERROR_CODE.OFFLINE;
type Props = { fundingOptions: GoalFundingOption[] };

export function CreateGoalForm({ fundingOptions }: Props) {
  const t = useTranslations("plan.goals");
  const locale = useLocale();
  const router = useRouter();
  const nameId = useId();
  const targetId = useId();
  const dateId = useId();
  const { online } = useOnlineStatusClient();
  const statusAlert = useStatusAlert();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState<number | null>(null);
  const [goalType, setGoalType] = useState<GoalType | null>(null);
  const [targetDate, setTargetDate] = useState("");
  const [selectedSourceKey, setSelectedSourceKey] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const compatibleOptions = goalType
    ? fundingOptions.filter((option) =>
        goalType === GoalType.PAYOFF
          ? option.sourceType === GoalFundingSourceType.DEBT
          : option.sourceType !== GoalFundingSourceType.DEBT,
      )
    : [];
  const selectedSource = compatibleOptions.find(
    (option) => goalFundingSourceKey(option) === selectedSourceKey,
  );

  const showCreateError = (code: ErrorCode) => {
    statusAlert.show({
      variant: AlertVariant.DANGER,
      title: t("create"),
      description: t(`errors.${code}`),
    });
  };

  const onSubmit = () => {
    statusAlert.hide();
    if (!online) {
      showCreateError(CLIENT_ACTION_ERROR_CODE.OFFLINE);
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
        showCreateError(result.code);
        return;
      }
      if (selectedSource?.isAvailable) {
        const linkResult = await linkGoalFundingAction({
          goalId: result.goalId,
          sourceKind: selectedSource.kind,
          sourceId: selectedSource.sourceId,
        });
        if (linkResult.status !== "success") {
          showCreateError(linkResult.code);
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

  const close = () => {
    statusAlert.hide();
    setOpen(false);
    setName("");
    setTarget(null);
    setGoalType(null);
    setTargetDate("");
    setSelectedSourceKey(null);
  };

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="w-full"
        data-testid="goal-create-open"
        isDisabled={!online}
        onPress={() => {
          if (!online) return;
          statusAlert.hide();
          setOpen(true);
        }}
      >
        {online ? t("create") : t("errors.offline")}
      </Button>
    );
  }

  return (
    <Sheet isOpen onOpenChange={(next) => !next && close()}>
      <ActionSheetLayout>
        <ActionSheetLayout.Header>
          <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
            {t("create")}
          </Sheet.Heading>
        </ActionSheetLayout.Header>
        <ActionSheetLayout.Body>
          <div
            className="flex flex-col gap-(--space-3)"
            data-testid="goal-create-form"
          >
            <StatusAlert
              variant={AlertVariant.INFO}
              title={t("notBalanceTitle")}
              description={t("notBalanceBody")}
            />
            <TextField
              id={nameId}
              label={t("createNameLabel")}
              placeholder={t("createNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <fieldset className="flex flex-col gap-(--space-2)">
              <legend className="text-sm font-medium text-text-primary">
                {t("createTypeLabel")}
              </legend>
              <ChoiceTileGroup>
                {GOAL_TYPE_VALUES.map((value) => (
                  <ChoiceTile
                    key={value}
                    label={t(`type.${value}`)}
                    selected={goalType === value}
                    onPress={() => {
                      setGoalType(value);
                      setSelectedSourceKey(null);
                    }}
                    role="radio"
                  />
                ))}
              </ChoiceTileGroup>
            </fieldset>
            <AmountField
              id={targetId}
              label={t("createTargetLabel")}
              value={target}
              onValueChange={setTarget}
            />
            <DatePickerField
              id={dateId}
              label={t("createDateLabel")}
              value={targetDate}
              onChange={setTargetDate}
            />
            {goalType ? (
              <fieldset className="flex flex-col gap-(--space-2)">
                <legend className="text-sm font-medium text-text-primary">
                  {t("createFundingLabel")}
                </legend>
                <p className="text-xs text-text-secondary">
                  {t("createFundingHint")}
                </p>
                <GoalFundingSourcePicker
                  options={compatibleOptions}
                  selectedKey={selectedSourceKey}
                  onSelect={setSelectedSourceKey}
                  locale={locale}
                  alreadyLinkedLabel={t("fundingAlreadyLinked")}
                  groupLabel={(group) => t(`fundingGroup.${group}`)}
                  aria-label={t("createFundingLabel")}
                  searchLabel={t("fundingSearchLabel")}
                  searchPlaceholder={t("fundingSearchPlaceholder")}
                  noMatchesLabel={t("fundingNoMatches")}
                />
                <p className="text-xs text-text-secondary">
                  {t("createFundingOptional")}
                </p>
              </fieldset>
            ) : null}
          </div>
        </ActionSheetLayout.Body>
        <SheetActionFooter
          secondaryLabel={t("createCancel")}
          primaryLabel={t("createSubmit")}
          onSecondary={close}
          onPrimary={onSubmit}
          primaryTestId="goal-create-submit"
          isDisabled={!online}
          isPrimaryDisabled={
            name.trim().length < 2 ||
            target == null ||
            target <= 0 ||
            goalType == null
          }
          isPending={isPending}
        />
      </ActionSheetLayout>
    </Sheet>
  );
}
