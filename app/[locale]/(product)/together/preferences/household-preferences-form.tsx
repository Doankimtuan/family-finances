"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { HouseholdPreferences } from "@/modules/tenancy/application/get-household-preferences";
import { HOUSEHOLD_LOCALE } from "@/modules/tenancy/application/tenancy-constants";
import { Card } from "@/shared/patterns/card";
import { SectionHeader } from "@/shared/patterns/section-header";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { updatePreferencesAction } from "./actions";
import type { UpdatePreferencesActionState } from "./actions";

type PreferencesErrorCode = Extract<
  UpdatePreferencesActionState,
  { status: "error" }
>["code"];

export function HouseholdPreferencesForm({
  initial,
}: {
  initial: HouseholdPreferences;
}) {
  const t = useTranslations("together.preferences");
  const router = useRouter();
  const [locale, setLocale] = useState(initial.locale);
  const [saved, setSaved] = useState(false);
  const [errorCode, setErrorCode] = useState<PreferencesErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();
  const dirty = locale !== initial.locale;

  const onSave = () => {
    setSaved(false);
    setErrorCode(null);
    startTransition(async () => {
      const result = await updatePreferencesAction({
        locale,
        timezone: initial.timezone,
        baseCurrency: initial.baseCurrency,
      });
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
      data-testid="household-preferences"
    >
      {!initial.canEdit ? (
        <StatusAlert
          variant="info"
          title={t("readOnlyTitle")}
          description={t("readOnlyBody")}
        />
      ) : null}

      <StatusAlert
        variant="info"
        title={t("moneySafeTitle")}
        description={t("moneySafeBody")}
      />

      {saved ? (
        <StatusAlert
          variant="success"
          title={t("savedTitle")}
          description={t("savedBody")}
        />
      ) : null}
      {errorCode ? (
        <StatusAlert
          variant="danger"
          title={t("errorTitle")}
          description={t(`errors.${errorCode}`)}
        />
      ) : null}

      <section className="flex flex-col gap-(--space-3)">
        <SectionHeader
          title={t("interpretationTitle")}
          description={t("interpretationDescription")}
        />
        <Card className="gap-(--space-4) p-(--space-4)">
          <label
            htmlFor="household-locale"
            className="flex flex-col gap-(--space-2) text-sm font-medium text-text-primary"
          >
            {t("localeLabel")}
            <select
              id="household-locale"
              value={locale}
              disabled={!initial.canEdit || isPending}
              onChange={(event) =>
                setLocale(
                  event.target.value === HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM
                    ? HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM
                    : HOUSEHOLD_LOCALE.ENGLISH_VIETNAM,
                )
              }
              className="min-h-11 w-full rounded-md border border-border-subtle bg-surface px-(--space-3) text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-(--opacity-disabled)"
            >
              <option value={HOUSEHOLD_LOCALE.ENGLISH_VIETNAM}>
                {t("localeEnglish")}
              </option>
              <option value={HOUSEHOLD_LOCALE.VIETNAMESE_VIETNAM}>
                {t("localeVietnamese")}
              </option>
            </select>
          </label>

          <div className="flex flex-col gap-(--space-1)">
            <Text size="sm" tone="secondary">
              {t("timezoneLabel")}
            </Text>
            <Text size="sm" className="font-medium text-text-primary">
              {initial.timezone}
            </Text>
          </div>
          <div className="flex flex-col gap-(--space-1)">
            <Text size="sm" tone="secondary">
              {t("currencyLabel")}
            </Text>
            <Text size="sm" className="font-medium text-text-primary">
              {initial.baseCurrency}
            </Text>
          </div>
        </Card>
      </section>

      {initial.canEdit ? (
        <Button
          variant="primary"
          className="w-full"
          data-testid="preferences-save"
          isDisabled={!dirty || isPending}
          onPress={onSave}
        >
          {isPending ? t("saving") : t("save")}
        </Button>
      ) : null}
    </div>
  );
}
