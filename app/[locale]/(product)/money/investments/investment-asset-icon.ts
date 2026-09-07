import type { IconSvgElement } from "@hugeicons/react";
import {
  BankIcon,
  ChartBarLineIcon,
  SmartPhoneIcon,
  Wallet02Icon,
} from "@hugeicons/core-free-icons";
import { InvestmentAssetClass } from "@/modules/investments/application/investment-constants";
import type { InvestmentUxType } from "@/modules/investments/application/investment-ux";

const INVESTMENT_ASSET_ICONS = {
  [InvestmentAssetClass.STOCK]: ChartBarLineIcon,
  [InvestmentAssetClass.FUND]: Wallet02Icon,
  [InvestmentAssetClass.CRYPTO]: SmartPhoneIcon,
  [InvestmentAssetClass.GOLD]: BankIcon,
  [InvestmentAssetClass.BOND]: Wallet02Icon,
} as const satisfies Record<InvestmentUxType, IconSvgElement>;

/** Semantic asset-class glyph used on investment scan and detail surfaces. */
export function investmentAssetIcon(asset: InvestmentUxType): IconSvgElement {
  return INVESTMENT_ASSET_ICONS[asset];
}
