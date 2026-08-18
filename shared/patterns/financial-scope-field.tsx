"use client";

import { UserGroupIcon, UserIcon } from "@hugeicons/core-free-icons";
import { useTranslations } from "next-intl";
import {
  FINANCIAL_SCOPE,
  type FinancialScope,
} from "@/modules/shared-kernel/application/financial-scope";
import { ChoiceTile, ChoiceTileGroup } from "./choice-tile";
import { AppIcon } from "@/shared/ui/app-icon";
import { FormField } from "@/shared/ui/form/form-field";
import { IconContainer } from "@/shared/ui/icon-container";

type Props = {
  value: FinancialScope;
  onChange: (value: FinancialScope) => void;
  error?: string;
  disabled?: boolean;
  testId?: string;
};

export function FinancialScopeField({
  value,
  onChange,
  error,
  disabled = false,
  testId = "financial-scope-field",
}: Props) {
  const t = useTranslations("money.ownership");

  return (
    <FormField
      id={testId}
      label={t("label")}
      error={error}
      description={t(
        value === FINANCIAL_SCOPE.PERSONAL ? "personalHint" : "householdHint",
      )}
    >
      <div
        id={testId}
        role="radiogroup"
        aria-label={t("label")}
        data-testid={testId}
      >
        <ChoiceTileGroup>
          <ChoiceTile
            label={t("household")}
            selected={value === FINANCIAL_SCOPE.HOUSEHOLD}
            onPress={() => onChange(FINANCIAL_SCOPE.HOUSEHOLD)}
            role="radio"
            isDisabled={disabled}
            icon={
              <IconContainer tone="neutral" size="sm">
                <AppIcon icon={UserGroupIcon} size="sm" />
              </IconContainer>
            }
            className={disabled ? "opacity-60" : undefined}
          />
          <ChoiceTile
            label={t("personal")}
            selected={value === FINANCIAL_SCOPE.PERSONAL}
            onPress={() => onChange(FINANCIAL_SCOPE.PERSONAL)}
            role="radio"
            isDisabled={disabled}
            icon={
              <IconContainer tone="neutral" size="sm">
                <AppIcon icon={UserIcon} size="sm" />
              </IconContainer>
            }
            className={disabled ? "opacity-60" : undefined}
          />
        </ChoiceTileGroup>
      </div>
    </FormField>
  );
}
