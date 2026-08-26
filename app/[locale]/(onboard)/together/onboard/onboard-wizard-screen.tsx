"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { IconSvgElement } from "@hugeicons/react";
import { MotionStep, MotionStepDirection } from "@/shared/motion";
import {
  AmountField,
  AuthScreenShell,
  ChoiceTile,
  ChoiceTileGroup,
  SectionHeader,
} from "@/shared/patterns";
import { AlertVariant } from "@/shared/ui/alert";
import { AppIcon } from "@/shared/ui/app-icon";
import { Button } from "@/shared/ui/button";
import { IconContainer } from "@/shared/ui/icon-container";
import { ACTION_ICONS, FINANCE_ICONS } from "@/shared/ui/icon-registry";
import { Progress } from "@/shared/ui/progress";
import { StatusAlert } from "@/shared/ui/status-alert";
import { TextField } from "@/shared/ui/form";
import { useStatusAlert } from "@/providers/status-alert-provider";
import type { PlanPreset } from "@/modules/tenancy/application/create-household.schema";
import { PlanPreset as PlanPresetValue } from "@/modules/tenancy/application/create-household.schema";
import {
  HOUSEHOLD_BASE_CURRENCY,
  HOUSEHOLD_LOCALE,
  HOUSEHOLD_TIMEZONE,
} from "@/modules/tenancy/application/tenancy-constants";
import { createHouseholdAction } from "./actions";

const TOTAL_STEPS = 2;

const PLAN_PRESET_OPTIONS: Array<{
  value: PlanPreset;
  labelKey: "planBalanced" | "planSimple";
  hintKey: "planBalancedHint" | "planSimpleHint";
  icon: IconSvgElement;
}> = [
  {
    value: PlanPresetValue.BALANCED,
    labelKey: "planBalanced",
    hintKey: "planBalancedHint",
    icon: FINANCE_ICONS.wallet,
  },
  {
    value: PlanPresetValue.SIMPLE,
    labelKey: "planSimple",
    hintKey: "planSimpleHint",
    icon: FINANCE_ICONS.savings,
  },
];

/**
 * Two-step onboard wizard (AC-014): household name → cash account & Jar
 * preset → Home. Partners awareness is a note on step 1, not a step.
 */
export function OnboardWizardScreen() {
  const t = useTranslations("onboard");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<MotionStepDirection>(
    MotionStepDirection.FORWARD,
  );
  const [name, setName] = useState("");
  const [accountName, setAccountName] = useState(t("accountNamePlaceholder"));
  const [openingBalance, setOpeningBalance] = useState<number | null>(0);
  const [planPreset, setPlanPreset] = useState<PlanPreset | null>(
    PlanPresetValue.BALANCED,
  );
  const [nameError, setNameError] = useState(false);
  const [accountError, setAccountError] = useState(false);
  const [skipAccount, setSkipAccount] = useState(false);
  const statusAlert = useStatusAlert();
  const [isPending, startTransition] = useTransition();

  const progressLabel = t("stepOf", { current: step, total: TOTAL_STEPS });
  const selectedPreset = PLAN_PRESET_OPTIONS.find(
    (option) => option.value === planPreset,
  );
  const selectedPlanHint = selectedPreset
    ? t(selectedPreset.hintKey)
    : t("planSetUpLaterHint");

  const goNextFromHousehold = () => {
    statusAlert.hide();
    if (name.trim().length < 2) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setDirection(MotionStepDirection.FORWARD);
    setStep(2);
  };

  const goBackToHousehold = () => {
    statusAlert.hide();
    setDirection(MotionStepDirection.BACKWARD);
    setStep(1);
  };

  const skipCashAccount = () => {
    setSkipAccount(true);
    setAccountError(false);
    finish(true);
  };

  const finish = (shouldSkipAccount = skipAccount) => {
    statusAlert.hide();
    if (!shouldSkipAccount && accountName.trim().length < 1) {
      setAccountError(true);
      return;
    }
    setAccountError(false);
    startTransition(async () => {
      const result = await createHouseholdAction({
        name: name.trim(),
        accountName: shouldSkipAccount ? undefined : accountName.trim(),
        openingBalance: openingBalance ?? 0,
        planPreset: shouldSkipAccount ? null : planPreset,
        locale:
          locale === "vi"
            ? HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM
            : HOUSEHOLD_LOCALE.ENGLISH_VIETNAM,
        timezone: HOUSEHOLD_TIMEZONE.VIETNAM,
        baseCurrency: HOUSEHOLD_BASE_CURRENCY.VIETNAM_DONG,
      });
      // Success / already_member redirect inside the server action.
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: t("errorTitle"),
        description: t(`errors.${result.code}`),
      });
    });
  };

  return (
    <AuthScreenShell testId="onboard-wizard" align="start">
      <Progress value={step} max={TOTAL_STEPS} label={progressLabel} />

      <MotionStep stepKey={`onboard-step-${step}`} direction={direction}>
        {step === 1 ? (
          <section className="flex flex-1 flex-col gap-(--space-4)">
            <SectionHeader
              title={t("step1Title")}
              description={t("step1Description")}
            />
            <TextField
              id="onboard-household-name"
              label={t("householdNameLabel")}
              placeholder={t("householdNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError ? tValidation("required") : undefined}
              autoComplete="organization"
            />
            <StatusAlert
              variant={AlertVariant.INFO}
              title={t("aloneNoteTitle")}
              description={t("aloneNoteBody")}
            />
            <div className="mt-auto pt-(--space-2)">
              <Button
                variant="primary"
                className="min-h-12 w-full"
                data-testid="onboard-next"
                onPress={goNextFromHousehold}
                isDisabled={isPending}
              >
                {t("continue")}
              </Button>
            </div>
          </section>
        ) : (
          <section className="flex flex-1 flex-col gap-(--space-4)">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                className="min-h-11 px-(--space-2) text-sm text-text-secondary"
                onPress={skipCashAccount}
                isDisabled={isPending || skipAccount}
                data-testid="onboard-skip-account"
              >
                {t("skipAccount")}
              </Button>
            </div>
            <SectionHeader
              title={t("step2Title")}
              description={t("step2Description")}
            />
            <div className="flex flex-col gap-(--space-3)">
              <h2 className="text-sm font-semibold text-text-primary">
                {t("cashAccountTitle")}
              </h2>
              <TextField
                id="onboard-account-name"
                label={t("accountNameLabel")}
                placeholder={t("accountNamePlaceholder")}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                error={accountError ? tValidation("required") : undefined}
              />
              <AmountField
                id="onboard-opening-balance"
                label={t("openingBalanceLabel")}
                description={t("openingBalanceDescription")}
                value={openingBalance}
                onValueChange={setOpeningBalance}
                data-testid="onboard-opening-balance"
                disabled={isPending || skipAccount}
              />
            </div>
            <fieldset>
              <legend className="text-sm font-semibold text-text-primary">
                {t("planPresetLabel")}
              </legend>
              <p className="mt-1 text-sm leading-snug text-text-secondary">
                {t("planPresetDescription")}
              </p>
              <div
                role="radiogroup"
                aria-label={t("planPresetLabel")}
                className="mt-(--space-2)"
              >
                <ChoiceTileGroup
                  hint={
                    skipAccount
                      ? t("planSkippedWithoutAccount")
                      : selectedPlanHint
                  }
                >
                  {PLAN_PRESET_OPTIONS.map((option) => (
                    <ChoiceTile
                      key={option.value}
                      role="radio"
                      label={t(option.labelKey)}
                      selected={planPreset === option.value}
                      onPress={() => setPlanPreset(option.value)}
                      isDisabled={isPending || skipAccount}
                      testId={`onboard-plan-${option.value}`}
                      icon={
                        <IconContainer
                          tone={
                            planPreset === option.value ? "primary" : "neutral"
                          }
                          size="sm"
                        >
                          <AppIcon icon={option.icon} size="sm" />
                        </IconContainer>
                      }
                    />
                  ))}
                  <ChoiceTile
                    role="radio"
                    label={t("planSetUpLater")}
                    selected={planPreset === null}
                    onPress={() => setPlanPreset(null)}
                    isDisabled={isPending || skipAccount}
                    testId="onboard-plan-set-up-later"
                    className="col-span-2 border-dashed"
                    icon={
                      <IconContainer
                        tone={planPreset === null ? "primary" : "neutral"}
                        size="sm"
                      >
                        <AppIcon icon={FINANCE_ICONS.account} size="sm" />
                      </IconContainer>
                    }
                  />
                </ChoiceTileGroup>
              </div>
            </fieldset>
            <div className="mt-auto grid grid-cols-3 gap-(--space-2) pt-(--space-2)">
              <Button
                variant="ghost"
                className="min-h-12 w-full px-(--space-2)"
                onPress={goBackToHousehold}
                isDisabled={isPending}
              >
                <span className="inline-flex items-center gap-(--space-1)">
                  <AppIcon icon={ACTION_ICONS.back} size="sm" emphasized />
                  {t("back")}
                </span>
              </Button>
              <Button
                variant="primary"
                className="col-span-2 min-h-12 w-full"
                data-testid="onboard-finish"
                onPress={() => finish()}
                isDisabled={isPending}
              >
                {isPending ? t("finishing") : t("finish")}
              </Button>
            </div>
          </section>
        )}
      </MotionStep>
    </AuthScreenShell>
  );
}
