"use server";

import {
  archiveSavingsProduct,
  archiveSavingsProvider,
  createSavingsProduct,
  createSavingsProvider,
  updateSavingsProduct,
  updateSavingsProvider,
} from "@/modules/savings/application/commands/manage-savings-catalog";
import { revalidateSavingsCatalogViews } from "@/app/mutation-revalidation";

export async function createSavingsProviderAction(input: unknown) {
  const result = await createSavingsProvider(input);
  if (result.ok) revalidateSavingsCatalogViews();
  return result.ok
    ? { status: "success" as const, provider: result.value }
    : { status: "error" as const, code: result.code };
}

export async function updateSavingsProviderAction(
  providerId: string,
  input: unknown,
) {
  const result = await updateSavingsProvider(providerId, input);
  if (result.ok) revalidateSavingsCatalogViews();
  return result.ok
    ? { status: "success" as const, provider: result.value }
    : { status: "error" as const, code: result.code };
}

export async function archiveSavingsProviderAction(providerId: string) {
  const result = await archiveSavingsProvider(providerId);
  if (result.ok) revalidateSavingsCatalogViews();
  return result.ok
    ? { status: "success" as const }
    : { status: "error" as const, code: result.code };
}

export async function createSavingsProductAction(input: unknown) {
  const result = await createSavingsProduct(input);
  if (result.ok) revalidateSavingsCatalogViews();
  return result.ok
    ? { status: "success" as const, product: result.value }
    : { status: "error" as const, code: result.code };
}

export async function updateSavingsProductAction(
  packageId: string,
  input: unknown,
) {
  const result = await updateSavingsProduct(packageId, input);
  if (result.ok) revalidateSavingsCatalogViews();
  return result.ok
    ? { status: "success" as const, product: result.value }
    : { status: "error" as const, code: result.code };
}

export async function archiveSavingsProductAction(packageId: string) {
  const result = await archiveSavingsProduct(packageId);
  if (result.ok) revalidateSavingsCatalogViews();
  return result.ok
    ? { status: "success" as const }
    : { status: "error" as const, code: result.code };
}
