"use client";

import { useTranslations } from "next-intl";
import { InvestmentAssetClass } from "@/modules/investments/application/investment-constants";
import {
  investmentUxConfig,
  type InvestmentUxType,
} from "@/modules/investments/application/investment-ux";
import { ChoiceTile } from "@/shared/patterns/choice-tile";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { Text } from "@/shared/ui/text";
import { investmentAssetIcon } from "./investment-asset-icon";

const OPENING_ASSET_CLASS_OPTIONS = [
  InvestmentAssetClass.STOCK,
  InvestmentAssetClass.FUND,
  InvestmentAssetClass.CRYPTO,
  InvestmentAssetClass.GOLD,
  InvestmentAssetClass.BOND,
] as const;

type OpeningAssetClassPickerProps = {
  selected: InvestmentUxType;
  onSelect: (next: InvestmentUxType) => void;
};

/** Compact stacked asset-class rows for the opening wizard. */
export function OpeningAssetClassPicker({
  selected,
  onSelect,
}: OpeningAssetClassPickerProps) {
  const tUx = useTranslations("money.investments");

  return (
    <div
      className="grid gap-(--space-2)"
      role="group"
      aria-labelledby="investment-type-title"
    >
      {OPENING_ASSET_CLASS_OPTIONS.map((item) => {
        const itemConfig = investmentUxConfig(item);
        return (
          <ChoiceTile
            key={item}
            selected={selected === item}
            onPress={() => onSelect(item)}
            testId={`investment-type-${item}`}
            icon={
              <IconContainer tone={IconContainerTone.INVESTMENT} size="sm">
                <AppIcon
                  icon={investmentAssetIcon(item)}
                  size={AppIconSize.SM}
                />
              </IconContainer>
            }
            className="items-start py-(--space-3)"
          >
            <span className="flex min-w-0 flex-col gap-(--space-1)">
              <Text size="sm" weight="semibold">
                {tUx(itemConfig.titleKey)}
              </Text>
              <Text
                size="xs"
                tone="secondary"
                className="text-pretty leading-snug"
              >
                {tUx(itemConfig.descriptionKey)}
              </Text>
            </span>
          </ChoiceTile>
        );
      })}
    </div>
  );
}
