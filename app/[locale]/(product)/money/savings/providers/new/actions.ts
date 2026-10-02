"use server";

import {
  createSavingsProvider,
  updateSavingsProvider,
  createSavingsProduct,
} from "@/modules/savings/application/commands/manage-savings-catalog";
import {
  savingsProviderCreateSchema,
  initialSavingsProduct,
} from "@/modules/savings/application/savings-provider-create";
import { PRODUCT_ACTION_ERROR_CODE } from "@/modules/tenancy/application/product-action-error";
import { revalidateSavingsCatalogViews } from "@/app/mutation-revalidation";

/** Reuses authorized catalog commands; a package retry retains the saved provider. */
export async function saveSavingsProviderWithPackage(
  raw: unknown,
  savedProviderId: string | null,
) {
  const parsed = savingsProviderCreateSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false as const,
      code: PRODUCT_ACTION_ERROR_CODE.INVALID,
      providerId: savedProviderId,
    };
  const provider = savedProviderId
    ? await updateSavingsProvider(savedProviderId, parsed.data)
    : await createSavingsProvider(parsed.data);
  if (!provider.ok) return { ...provider, providerId: savedProviderId };
  revalidateSavingsCatalogViews();
  const product = initialSavingsProduct(parsed.data, provider.value.id);
  if (product) {
    const result = await createSavingsProduct(product);
    if (!result.ok) return { ...result, providerId: provider.value.id };
    revalidateSavingsCatalogViews();
  }
  return { ok: true as const };
}
