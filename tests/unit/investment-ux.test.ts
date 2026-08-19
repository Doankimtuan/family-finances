import { describe, expect, it } from "vitest";
import { InvestmentAssetClass } from "@/modules/investments/application/investment-constants";
import {
  investmentEntryModeMessageKeys,
  investmentUxConfig,
  type InvestmentUxMessageKey,
} from "@/modules/investments/application/investment-ux";
import enMoney from "@/messages/en/money.json";
import viMoney from "@/messages/vi/money.json";

function messageAt(messages: unknown, key: InvestmentUxMessageKey): string {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[segment];
  }, messages);
  if (typeof value !== "string") {
    throw new Error(`Missing investment message: ${key}`);
  }
  return value;
}

describe("investment interaction UX registry", () => {
  it("keeps typed message configuration distinct by asset type", () => {
    expect(investmentUxConfig(InvestmentAssetClass.STOCK).titleKey).toBe(
      "ux.assetClasses.stock.title",
    );
    expect(
      investmentUxConfig(InvestmentAssetClass.FUND).purchaseActionKey,
    ).toBe("ux.assetClasses.fund.purchaseAction");
    expect(
      investmentUxConfig(InvestmentAssetClass.FUND).disposalPriceLabelKey,
    ).toBe("ux.assetClasses.fund.disposalPriceLabel");
    expect(investmentUxConfig(InvestmentAssetClass.GOLD).priceLabelKey).toBe(
      "ux.assetClasses.gold.priceLabel",
    );
    expect(investmentUxConfig(InvestmentAssetClass.CRYPTO).descriptionKey).toBe(
      "ux.assetClasses.crypto.description",
    );
  });

  it("resolves every supported asset class in both locales", () => {
    for (const assetClass of Object.values(InvestmentAssetClass)) {
      const config = investmentUxConfig(assetClass);
      const keys = [
        config.titleKey,
        config.descriptionKey,
        config.instrumentLabelKey,
        config.quantityLabelKey,
        config.priceLabelKey,
        config.valuationPriceLabelKey,
        config.disposalPriceLabelKey,
        config.unitSuffixKey,
        config.priceCurrencyKey,
        config.providerHintKey,
        config.purchaseActionKey,
        config.disposalActionKey,
        config.incomeLabelKey,
        config.unitLabelKey,
      ].filter((key): key is InvestmentUxMessageKey => key !== undefined);
      for (const key of keys) {
        expect(messageAt(enMoney.investments, key)).toBeTruthy();
        expect(messageAt(viMoney.investments, key)).toBeTruthy();
      }
    }
    expect(
      messageAt(enMoney.investments, investmentEntryModeMessageKeys.historical),
    ).toBe("I already owned this before");
    expect(
      messageAt(viMoney.investments, investmentEntryModeMessageKeys.purchase),
    ).toBe("Tôi mua / đầu tư ngay bây giờ");
  });
});
