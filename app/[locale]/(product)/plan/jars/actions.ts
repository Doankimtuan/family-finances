"use server";

import {
  createJar,
  setJarState,
  upsertJarPlan,
  reallocateJarCapacity,
  type CreateJarInput,
  type SetJarStateInput,
  type UpsertJarPlanInput,
  type ReallocateJarCapacityInput,
  type ReallocateJarCapacityErrorCode,
} from "@/modules/plan/application";
import {
  createCategory,
  type CreateCategoryInput,
} from "@/modules/ledger/application";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";
import type { LedgerActionErrorCode } from "@/modules/ledger/application/ledger-constants";

export type CreateJarActionState =
  | { status: "success"; jarId: string }
  | {
      status: "error";
      code: ProductActionErrorCode;
    };

export async function createJarAction(
  input: CreateJarInput,
): Promise<CreateJarActionState> {
  const result = await createJar(input);
  if (result.ok) {
    return { status: "success", jarId: result.jarId };
  }
  return { status: "error", code: result.code };
}

export type SetJarStateActionState =
  | { status: "success"; state: SetJarStateInput["state"] }
  | {
      status: "error";
      code: ProductActionErrorCode;
    };

export async function setJarStateAction(
  input: SetJarStateInput,
): Promise<SetJarStateActionState> {
  const result = await setJarState(input);
  if (result.ok) {
    return { status: "success", state: result.state };
  }
  return { status: "error", code: result.code };
}

export type UpsertJarPlanActionState =
  | { status: "success" }
  | {
      status: "error";
      code: ProductActionErrorCode;
    };

export async function upsertJarPlanAction(
  input: UpsertJarPlanInput,
): Promise<UpsertJarPlanActionState> {
  const result = await upsertJarPlan(input);
  if (result.ok) {
    return { status: "success" };
  }
  return { status: "error", code: result.code };
}

export type CreateCategoryActionState =
  | { status: "success"; categoryId: string }
  | {
      status: "error";
      code: ProductActionErrorCode | LedgerActionErrorCode;
    };

export async function createCategoryAction(
  input: CreateCategoryInput,
): Promise<CreateCategoryActionState> {
  const result = await createCategory(input);
  if (result.ok) {
    return { status: "success", categoryId: result.categoryId };
  }
  return { status: "error", code: result.code };
}

export type ReallocateJarCapacityActionState =
  | {
      status: "success";
      planMovementId: string;
      ledgerImpact: number;
      ledgerTransactionsCreated: number;
      inboxItemId: string | null;
      isEmergency: boolean;
    }
  | {
      status: "error";
      code: ReallocateJarCapacityErrorCode;
    };

export async function reallocateJarCapacityAction(
  input: ReallocateJarCapacityInput,
): Promise<ReallocateJarCapacityActionState> {
  const result = await reallocateJarCapacity(input);
  if (result.ok) {
    return {
      status: "success",
      planMovementId: result.planMovementId,
      ledgerImpact: result.ledgerImpact,
      ledgerTransactionsCreated: result.ledgerTransactionsCreated,
      inboxItemId: result.inboxItemId,
      isEmergency: result.isEmergency,
    };
  }
  return { status: "error", code: result.code };
}
