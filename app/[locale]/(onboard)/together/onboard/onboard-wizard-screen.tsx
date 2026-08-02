"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Progress } from "@/shared/ui/progress";
import { SectionHeader } from "@/shared/patterns/section-header";
import { AuthScreenShell } from "@/shared/patterns/auth-screen-shell";
import { TextField } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import type { PlanPreset } from "@/modules/tenancy/application/create-household.schema";
import type { CreateHouseholdErrorCode } from "@/modules/tenancy/application/create-household";
import { createHouseholdAction } from "./actions";

const TOTAL_STEPS = 3;

/**
 * ≤3-step onboard wizard (AC-014): household → partners awareness → seeds → Home.
 */
export function OnboardWizardScreen() {
  const t = useTranslations("onboard");
  const tValidation = useTranslations("validation");
  const locale = useLocale();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [accountName, setAccountName] = useState("Cash");
  const [planPreset, setPlanPreset] = useState<PlanPreset>("balanced");
  const [nameError, setNameError] = useState(false);
  const [accountError, setAccountError] = useState(false);
  const [errorCode, setErrorCode] = useState<CreateHouseholdErrorCode | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const progressValue = step;
  const progressLabel = t("stepOf", { current: step, total: TOTAL_STEPS });

  const goNextFromHousehold = () => {
    setErrorCode(null);
    if (name.trim().length < 2) {
      setNameError(true);
      return;
    }
    setNameError(false);
    setStep(2);
  };

  const finish = () => {
    setErrorCode(null);
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
        locale: locale === "vi" ? "vi-VN" : "en-VN",
        timezone: "Asia/Ho_Chi_Minh",
        baseCurrency: "VND",
      });
      // Success / already_member redirect inside the server action.
      setErrorCode(result.code);
    });
  };

  return (
    <AuthScreenShell testId="onboard-wizard" centered>
      <Progress value={progressValue} max={TOTAL_STEPS} label={progressLabel} />

      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("errorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-(--space-4)">
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
          <Button
            variant="primary"
            className="w-full"
            data-testid="onboard-next"
            onPress={goNextFromHousehold}
            isDisabled={isPending}
          >
            {t("continue")}
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-(--space-4)">
          <SectionHeader
            title={t("step2Title")}
            description={t("step2Description")}
          />
          <Text tone="secondary" size="sm" className="leading-relaxed">
            {t("step2Body")}
          </Text>
          <div className="flex flex-col gap-(--space-2)">
            <Button
              variant="primary"
              className="w-full"
              data-testid="onboard-next"
              onPress={() => setStep(3)}
              isDisabled={isPending}
            >
              {t("continue")}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onPress={() => setStep(1)}
              isDisabled={isPending}
            >
              {t("back")}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-(--space-4)">
          <SectionHeader
            title={t("step3Title")}
            description={t("step3Description")}
          />
          <TextField
            id="onboard-account-name"
            label={t("accountNameLabel")}
            placeholder={t("accountNamePlaceholder")}
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            error={accountError ? tValidation("required") : undefined}
          />
          <fieldset className="flex flex-col gap-(--space-2)">
            <Text size="sm" className="font-semibold text-text-primary">
              {t("planPresetLabel")}
            </Text>
            {(
              [
                ["balanced", "planBalanced"],
                ["simple", "planSimple"],
              ] as const
            ).map(([value, labelKey]) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-(--space-3) rounded-[var(--radius-lg)] border border-border-subtle bg-surface px-(--space-4) py-(--space-3)"
              >
                <input
                  type="radio"
                  name="planPreset"
                  value={value}
                  checked={planPreset === value}
                  onChange={() => setPlanPreset(value)}
                  className="mt-1 size-4 accent-[var(--color-accent)]"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-text-primary">
                    {t(labelKey)}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {t(`${labelKey}Hint`)}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-(--space-2)">
            <Button
              variant="primary"
              className="w-full"
              data-testid="onboard-finish"
              onPress={finish}
              isDisabled={isPending}
            >
              {isPending ? t("finishing") : t("finish")}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onPress={() => setStep(2)}
              isDisabled={isPending}
            >
              {t("back")}
            </Button>
          </div>
        </div>
      ) : null}
    </AuthScreenShell>
  );
}
