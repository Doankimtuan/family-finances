"use server";

import {
  previewMonthRitual,
  approveMonthRitual,
  correctMonthRitual,
  type CorrectMonthRitualInput,
} from "@/modules/plan/application";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";
import type { RitualStatus } from "@/modules/plan/application/ritual-types";

type Err = { status: "error"; code: ProductActionErrorCode };
type Ok = { status: "success"; ritualStatus: RitualStatus };

export async function previewRitualAction(): Promise<Ok | Err> {
  const result = await previewMonthRitual();
  if (result.ok) {
    return { status: "success", ritualStatus: result.status };
  }
  return { status: "error", code: result.code };
}

export async function approveRitualAction(): Promise<Ok | Err> {
  const result = await approveMonthRitual();
  if (result.ok) {
    return { status: "success", ritualStatus: result.status };
  }
  return { status: "error", code: result.code };
}

export async function correctRitualAction(
  input: CorrectMonthRitualInput,
): Promise<Ok | Err> {
  const result = await correctMonthRitual(input);
  if (result.ok) {
    return { status: "success", ritualStatus: result.status };
  }
  return { status: "error", code: result.code };
}
