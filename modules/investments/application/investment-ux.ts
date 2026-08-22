import {
  InvestmentAssetClass,
  InvestmentEntryMode,
  MarketPricingMode,
} from "./investment-constants";
import type { MarketInstrument } from "./investment-types";

export type InvestmentUxType =
  (typeof InvestmentAssetClass)[keyof typeof InvestmentAssetClass];

type InvestmentUxAssetField =
  | "title"
  | "description"
  | "instrumentLabel"
  | "quantityLabel"
  | "priceLabel"
  | "valuationPriceLabel"
  | "disposalPriceLabel"
  | "unitSuffix"
  | "priceCurrency"
  | "providerHint"
  | "purchaseAction"
  | "disposalAction"
  | "incomeLabel";

export type InvestmentUxMessageKey =
  | `ux.assetClasses.${InvestmentUxType}.${InvestmentUxAssetField}`
  | "ux.actions.buyMore"
  | "ux.actions.sell"
  | "ux.income.dividend"
  | "opening.assetClass.fund"
  | "opening.assetClass.gold"
  | "opening.historicalModeTitle"
  | "opening.purchaseModeTitle"
  | "opening.quantityLabel"
  | "opening.unitLabel";

export type InvestmentUxConfig = {
  assetClass: InvestmentUxType;
  titleKey: InvestmentUxMessageKey;
  descriptionKey: InvestmentUxMessageKey;
  instrumentLabelKey: InvestmentUxMessageKey;
  quantityLabelKey: InvestmentUxMessageKey;
  priceLabelKey: InvestmentUxMessageKey;
  valuationPriceLabelKey: InvestmentUxMessageKey;
  disposalPriceLabelKey: InvestmentUxMessageKey;
  unitSuffixKey: InvestmentUxMessageKey;
  priceCurrencyKey: InvestmentUxMessageKey;
  providerHintKey: InvestmentUxMessageKey;
  purchaseActionKey: InvestmentUxMessageKey;
  disposalActionKey: InvestmentUxMessageKey;
  incomeLabelKey: InvestmentUxMessageKey;
  unitLabelKey?: InvestmentUxMessageKey;
};

export const INVESTMENT_UX_REGISTRY = {
  [InvestmentAssetClass.CRYPTO]: {
    assetClass: InvestmentAssetClass.CRYPTO,
    titleKey: "ux.assetClasses.crypto.title",
    descriptionKey: "ux.assetClasses.crypto.description",
    instrumentLabelKey: "ux.assetClasses.crypto.instrumentLabel",
    quantityLabelKey: "opening.quantityLabel",
    priceLabelKey: "ux.assetClasses.crypto.priceLabel",
    valuationPriceLabelKey: "ux.assetClasses.crypto.valuationPriceLabel",
    disposalPriceLabelKey: "ux.assetClasses.crypto.disposalPriceLabel",
    unitSuffixKey: "ux.assetClasses.crypto.unitSuffix",
    priceCurrencyKey: "ux.assetClasses.crypto.priceCurrency",
    providerHintKey: "ux.assetClasses.crypto.providerHint",
    purchaseActionKey: "ux.actions.buyMore",
    disposalActionKey: "ux.actions.sell",
    incomeLabelKey: "ux.income.dividend",
  },
  [InvestmentAssetClass.STOCK]: {
    assetClass: InvestmentAssetClass.STOCK,
    titleKey: "ux.assetClasses.stock.title",
    descriptionKey: "ux.assetClasses.stock.description",
    instrumentLabelKey: "ux.assetClasses.stock.instrumentLabel",
    quantityLabelKey: "opening.quantityLabel",
    priceLabelKey: "ux.assetClasses.stock.priceLabel",
    valuationPriceLabelKey: "ux.assetClasses.stock.valuationPriceLabel",
    disposalPriceLabelKey: "ux.assetClasses.stock.disposalPriceLabel",
    unitSuffixKey: "ux.assetClasses.stock.unitSuffix",
    priceCurrencyKey: "ux.assetClasses.stock.priceCurrency",
    providerHintKey: "ux.assetClasses.stock.providerHint",
    purchaseActionKey: "ux.actions.buyMore",
    disposalActionKey: "ux.actions.sell",
    incomeLabelKey: "ux.income.dividend",
  },
  [InvestmentAssetClass.FUND]: {
    assetClass: InvestmentAssetClass.FUND,
    titleKey: "opening.assetClass.fund",
    descriptionKey: "ux.assetClasses.fund.description",
    instrumentLabelKey: "ux.assetClasses.fund.instrumentLabel",
    quantityLabelKey: "ux.assetClasses.fund.quantityLabel",
    priceLabelKey: "ux.assetClasses.fund.priceLabel",
    valuationPriceLabelKey: "ux.assetClasses.fund.valuationPriceLabel",
    disposalPriceLabelKey: "ux.assetClasses.fund.disposalPriceLabel",
    unitSuffixKey: "ux.assetClasses.fund.unitSuffix",
    priceCurrencyKey: "ux.assetClasses.fund.priceCurrency",
    providerHintKey: "ux.assetClasses.fund.providerHint",
    purchaseActionKey: "ux.assetClasses.fund.purchaseAction",
    disposalActionKey: "ux.assetClasses.fund.disposalAction",
    incomeLabelKey: "ux.assetClasses.fund.incomeLabel",
  },
  [InvestmentAssetClass.GOLD]: {
    assetClass: InvestmentAssetClass.GOLD,
    titleKey: "opening.assetClass.gold",
    descriptionKey: "ux.assetClasses.gold.description",
    instrumentLabelKey: "ux.assetClasses.gold.instrumentLabel",
    quantityLabelKey: "ux.assetClasses.gold.quantityLabel",
    priceLabelKey: "ux.assetClasses.gold.priceLabel",
    valuationPriceLabelKey: "ux.assetClasses.gold.valuationPriceLabel",
    disposalPriceLabelKey: "ux.assetClasses.gold.disposalPriceLabel",
    unitSuffixKey: "ux.assetClasses.gold.unitSuffix",
    priceCurrencyKey: "ux.assetClasses.gold.priceCurrency",
    providerHintKey: "ux.assetClasses.gold.providerHint",
    purchaseActionKey: "ux.actions.buyMore",
    disposalActionKey: "ux.actions.sell",
    incomeLabelKey: "ux.assetClasses.gold.incomeLabel",
    unitLabelKey: "opening.unitLabel",
  },
  [InvestmentAssetClass.BOND]: {
    assetClass: InvestmentAssetClass.BOND,
    titleKey: "ux.assetClasses.bond.title",
    descriptionKey: "ux.assetClasses.bond.description",
    instrumentLabelKey: "ux.assetClasses.bond.instrumentLabel",
    quantityLabelKey: "opening.quantityLabel",
    priceLabelKey: "ux.assetClasses.bond.priceLabel",
    valuationPriceLabelKey: "ux.assetClasses.bond.valuationPriceLabel",
    disposalPriceLabelKey: "ux.assetClasses.bond.disposalPriceLabel",
    unitSuffixKey: "ux.assetClasses.bond.unitSuffix",
    priceCurrencyKey: "ux.assetClasses.bond.priceCurrency",
    providerHintKey: "ux.assetClasses.bond.providerHint",
    purchaseActionKey: "ux.assetClasses.bond.purchaseAction",
    disposalActionKey: "ux.assetClasses.bond.disposalAction",
    incomeLabelKey: "ux.assetClasses.bond.incomeLabel",
  },
} satisfies Record<InvestmentUxType, InvestmentUxConfig>;

export const investmentUxConfig = (assetClass: InvestmentUxType) =>
  INVESTMENT_UX_REGISTRY[assetClass];

export const investmentEntryModeMessageKeys = {
  [InvestmentEntryMode.HISTORICAL]: "opening.historicalModeTitle",
  [InvestmentEntryMode.PURCHASE]: "opening.purchaseModeTitle",
} as const satisfies Record<InvestmentEntryMode, InvestmentUxMessageKey>;

export type InvestmentPricingContract = {
  pricingMode: MarketPricingMode;
  usesTotalValue: boolean;
  usesManualValuation: boolean;
  quantityLabel: "quantity" | "fundUnits";
};

export function resolveInvestmentPricingContract(
  assetClass: InvestmentUxType,
  instrument: MarketInstrument | null,
): InvestmentPricingContract {
  const pricingMode =
    instrument?.pricingMode ??
    (assetClass === InvestmentAssetClass.BOND
      ? MarketPricingMode.TOTAL_VALUE
      : MarketPricingMode.UNIT_PRICE);

  return {
    pricingMode,
    usesTotalValue: pricingMode === MarketPricingMode.TOTAL_VALUE,
    usesManualValuation: pricingMode === MarketPricingMode.MANUAL,
    quantityLabel:
      assetClass === InvestmentAssetClass.FUND ? "fundUnits" : "quantity",
  };
}
