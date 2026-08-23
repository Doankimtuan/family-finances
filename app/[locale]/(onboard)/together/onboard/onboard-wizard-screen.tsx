"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { IconSvgElement } from "@hugeicons/react";
import { MotionStep, MotionStepDirection } from "@/shared/motion";
import {
  AuthScreenShell,
  ChoiceTile,
  ChoiceTileGroup,
  SectionHeader,
} from "@/shared/patterns";
import { AlertVariant } from "@/shared/ui/alert";
import { AppIcon } from "@/shared/ui/app-icon";
import { Button } from "@/shared/ui/button";
import { IconContainer } from "@/shared/ui/icon-container";
import { FINANCE_ICONS } from "@/shared/ui/icon-registry";
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
  const [planPreset, setPlanPreset] = useState<PlanPreset>(
    PlanPresetValue.BALANCED,
  );
  const [nameError, setNameError] = useState(false);
  const [accountError, setAccountError] = useState(false);
  const statusAlert = useStatusAlert();
  const [isPending, startTransition] = useTransition();

  const progressLabel = t("stepOf", { current: step, total: TOTAL_STEPS });
  const selectedPreset =
    PLAN_PRESET_OPTIONS.find((option) => option.value === planPreset) ??
    PLAN_PRESET_OPTIONS[0];

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

  const finish = () => {
    statusAlert.hide();
    if (accountName.trim().length < 1) {
      setAccountError(true);
      return;
    }
    setAccountError(false);
    startTransition(async () => {
      const result = await createHouseholdAction({
        name: name.trim(),
        accountName: accountName.trim(),
        planPreset,
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
            <SectionHeader
              title={t("step2Title")}
              description={t("step2Description")}
            />
            <TextField
              id="onboard-account-name"
              label={t("accountNameLabel")}
              placeholder={t("accountNamePlaceholder")}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              error={accountError ? tValidation("required") : undefined}
            />
            <fieldset>
              <legend className="text-sm font-medium text-text-primary">
                {t("planPresetLabel")}
              </legend>
              <div
                role="radiogroup"
                aria-label={t("planPresetLabel")}
                className="mt-(--space-2)"
              >
                <ChoiceTileGroup hint={t(selectedPreset.hintKey)}>
                  {PLAN_PRESET_OPTIONS.map((option) => (
                    <ChoiceTile
                      key={option.value}
                      role="radio"
                      label={t(option.labelKey)}
                      selected={planPreset === option.value}
                      onPress={() => setPlanPreset(option.value)}
                      isDisabled={isPending}
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
                </ChoiceTileGroup>
              </div>
            </fieldset>
            <div className="mt-auto flex flex-col gap-(--space-2) pt-(--space-2)">
              <Button
                variant="primary"
                className="min-h-12 w-full"
                data-testid="onboard-finish"
                onPress={finish}
                isDisabled={isPending}
              >
                {isPending ? t("finishing") : t("finish")}
              </Button>
              <Button
                variant="tertiary"
                className="self-start"
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
