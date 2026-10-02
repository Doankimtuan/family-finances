import type { SavingCatalogProvider } from "./savings-provider-registry";
import type { Saving } from "./savings-types";
import { SavingsFamily } from "./savings-domain-rules";
import { buildSavingsOverviewModel } from "./savings-presentation";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";

/** Presentation totals preserve the overview's lifecycle and principal rules. */
export function buildSavingsProviderDirectory(
  catalog: SavingCatalogProvider[],
  savings: Saving[] | null,
) {
  const activeItems = buildSavingsOverviewModel(savings ?? []).activeItems;
  const rows = catalog.map((provider) => {
    const items = activeItems.filter(
      ({ saving }) => saving.providerId === provider.id,
    );
    const balances = new Map<string, number>();
    for (const item of items) {
      const currency = item.saving.productSnapshot.currency ?? DEFAULT_CURRENCY;
      balances.set(currency, (balances.get(currency) ?? 0) + item.principal);
    }
    return {
      provider,
      savingCount: items.length,
      balances: [...balances].map(([currency, amount]) => ({
        currency,
        amount,
      })),
    };
  });
  return {
    banks: rows.filter(
      ({ provider }) =>
        provider.isSystem && provider.family === SavingsFamily.BANK,
    ),
    platforms: rows.filter(
      ({ provider }) =>
        provider.isSystem && provider.family !== SavingsFamily.BANK,
    ),
    custom: rows.filter(({ provider }) => !provider.isSystem),
    providerCount: catalog.length,
    packageCount: catalog.reduce(
      (total, provider) => total + provider.packages.length,
      0,
    ),
    balancesAvailable: savings !== null,
  };
}

export type SavingsProviderDirectoryModel = ReturnType<
  typeof buildSavingsProviderDirectory
>;
