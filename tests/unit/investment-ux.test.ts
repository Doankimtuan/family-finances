import { describe, expect, it } from "vitest";
import { InvestmentAssetClass } from "@/modules/investments/application/investment-constants";
import {
  investmentEntryModeLabels,
  investmentUxConfig,
} from "@/modules/investments/application/investment-ux";
describe("investment interaction UX registry", () => {
  it("keeps user-facing configuration distinct by asset type", () => {
    expect(investmentUxConfig(InvestmentAssetClass.STOCK).title).toBe(
      "Chứng khoán",
    );
    expect(investmentUxConfig(InvestmentAssetClass.FUND).purchaseAction).toBe(
      "Đầu tư thêm",
    );
    expect(investmentUxConfig(InvestmentAssetClass.FUND).disposalAction).toBe(
      "Rút khỏi quỹ",
    );
    expect(investmentUxConfig(InvestmentAssetClass.GOLD).priceLabel).toBe(
      "Giá bạn mua",
    );
    expect(
      investmentUxConfig(InvestmentAssetClass.CRYPTO).description,
    ).toContain("Spot");
  });
  it("makes historical import and real purchase explicit", () => {
    expect(investmentEntryModeLabels.historical).toContain("sở hữu từ trước");
    expect(investmentEntryModeLabels.purchase).toContain("ngay bây giờ");
  });
});
