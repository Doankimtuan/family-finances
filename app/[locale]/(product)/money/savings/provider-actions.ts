"use server";

import {
  archiveSavingsProduct,
  archiveSavingsProvider,
  createSavingsProduct,
  createSavingsProvider,
  updateSavingsProduct,
  updateSavingsProvider,
} from "@/modules/savings/application/commands/manage-savings-catalog";

export async function createSavingsProviderAction(input: unknown) {
  const result = await createSavingsProvider(input);
  return result.ok
    ? { status: "success" as const, provider: result.value }
    : { status: "error" as const, code: result.code };
}

export async function updateSavingsProviderAction(
  providerId: string,
  input: unknown,
) {
  const result = await updateSavingsProvider(providerId, input);
  return result.ok
    ? { status: "success" as const, provider: result.value }
    : { status: "error" as const, code: result.code };
}

export async function archiveSavingsProviderAction(providerId: string) {
  const result = await archiveSavingsProvider(providerId);
  return result.ok
    ? { status: "success" as const }
    : { status: "error" as const, code: result.code };
}

export async function createSavingsProductAction(input: unknown) {
  const result = await createSavingsProduct(input);
  return result.ok
    ? { status: "success" as const, product: result.value }
    : { status: "error" as const, code: result.code };
}

export async function updateSavingsProductAction(
  packageId: string,
  input: unknown,
) {
  const result = await updateSavingsProduct(packageId, input);
  return result.ok
    ? { status: "success" as const, product: result.value }
    : { status: "error" as const, code: result.code };
}

export async function archiveSavingsProductAction(packageId: string) {
  const result = await archiveSavingsProduct(packageId);
  return result.ok
    ? { status: "success" as const }
    : { status: "error" as const, code: result.code };
}
