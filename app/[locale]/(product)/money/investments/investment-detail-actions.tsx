"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  moneyInvestmentBuyPath,
  moneyInvestmentSellPath,
} from "@/modules/tenancy/application/app-path";
import {
  investmentUxConfig,
  type InvestmentUxType,
} from "@/modules/investments/application/investment-ux";
import { QuickAction } from "@/shared/patterns/quick-action";

/**
 * Contextual actions under the holding hero: the primary "buy more" action
 * and secondary sell action.
 */
export function InvestmentDetailActions({
  holdingId,
  assetClass,
  showSell,
}: {
  holdingId: string;
  assetClass: InvestmentUxType;
  showSell: boolean;
}) {
  const tUx = useTranslations("money.investments");
  const router = useRouter();
  const ux = investmentUxConfig(assetClass);

  return (
    <div className="flex items-center gap-(--space-2)">
      <QuickAction
        className="min-w-0 flex-1"
        onPress={() => router.push(moneyInvestmentBuyPath(holdingId))}
        data-testid="investment-detail-buy"
        label={tUx(ux.purchaseActionKey)}
      />
      {showSell ? (
        <QuickAction
          variant="secondary"
          className="min-w-0 flex-1"
          onPress={() => router.push(moneyInvestmentSellPath(holdingId))}
          data-testid="investment-detail-sell"
          label={tUx(ux.disposalActionKey)}
        />
      ) : null}
    </div>
  );
}
