"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { IconSvgElement } from "@hugeicons/react";
import { MotionStep, MotionStepDirection } from "@/shared/motion";
import {
  AUTH_PRIMARY_ACTION_CLASS_NAME,
  AmountField,
  AuthScreenShell,
  BrandMark,
  ChoiceTile,
  ChoiceTileGroup,
} from "@/shared/patterns";
import { AlertVariant } from "@/shared/ui/alert";
import { AppIcon } from "@/shared/ui/app-icon";
import { Button } from "@/shared/ui/button";
import { Heading } from "@/shared/ui/heading";
import { IconContainer } from "@/shared/ui/icon-container";
import { PLAN_ICONS, UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { Progress } from "@/shared/ui/progress";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import { TextField } from "@/shared/ui/form";
import { useStatusAlert } from "@/providers/status-alert-provider";
import { PlanPreset } from "@/modules/tenancy/application/create-household.schema";
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
    value: PlanPreset.BALANCED,
    labelKey: "planBalanced",
    hintKey: "planBalancedHint",
    icon: PLAN_ICONS.jar,
  },
  {
    value: PlanPreset.SIMPLE,
    labelKey: "planSimple",
    hintKey: "planSimpleHint",
    icon: PLAN_ICONS.goal,
  },
];

/**
 * Two-step onboard wizard (AC-014): household name → cash account & Jar
 * preset → Home. Partners awareness is a note on step 1, not a step.
 */
export function OnboardWizardScreen() {
  const t = useTranslations("onboard");
  const tCommon = useTranslations("common");
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
    PlanPreset.BALANCED,
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
    <AuthScreenShell testId="onboard-wizard" align="start" busy={isPending}>
      <div className="flex items-center gap-(--space-2)">
        <BrandMark variant="soft" size="sm" decorative />
        <Text size="sm" weight="semibold" className="text-text-primary">
          {tCommon("brand")}
        </Text>
      </div>
      <Progress value={step} max={TOTAL_STEPS} label={progressLabel} />

      <MotionStep stepKey={`onboard-step-${step}`} direction={direction}>
        {step === 1 ? (
          <section className="flex flex-1 flex-col gap-(--space-4)">
            <OnboardStepHeader
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
                className={AUTH_PRIMARY_ACTION_CLASS_NAME}
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
            <OnboardStepHeader
              title={t("step2Title")}
              description={t("step2Description")}
            />
            <div className="flex flex-col gap-(--space-3)">
              <Heading
                level={2}
                className="text-sm font-semibold tracking-tight text-text-primary"
              >
                {t("cashAccountTitle")}
              </Heading>
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
                        <AppIcon icon={UTILITY_ICONS.info} size="sm" />
                      </IconContainer>
                    }
                  />
                </ChoiceTileGroup>
              </div>
            </fieldset>
            <div className="mt-auto flex flex-col gap-(--space-2) pt-(--space-2)">
              <Button
                variant="primary"
                className={AUTH_PRIMARY_ACTION_CLASS_NAME}
                data-testid="onboard-finish"
                onPress={() => finish()}
                isDisabled={isPending}
              >
                {isPending ? t("finishing") : t("finish")}
              </Button>
              <Button
                variant="ghost"
                className="min-h-11 w-full text-sm font-medium text-text-secondary"
                onPress={skipCashAccount}
                isDisabled={isPending || skipAccount}
                data-testid="onboard-skip-account"
              >
                {t("skipAccount")}
              </Button>
              <Button
                variant="ghost"
                className="min-h-11 w-full text-sm text-text-muted"
                onPress={goBackToHousehold}
                isDisabled={isPending}
              >
                {t("back")}
              </Button>
            </div>
          </section>
        )}
      </MotionStep>
    </AuthScreenShell>
  );
}

function OnboardStepHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-(--space-1)">
      <Heading level={1} className="text-2xl leading-tight tracking-tight">
        {title}
      </Heading>
      <Text tone="secondary" size="sm" className="leading-relaxed text-pretty">
        {description}
      </Text>
    </div>
  );
}
