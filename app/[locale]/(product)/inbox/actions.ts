"use server";

import {
  resolveInboxItemToJar,
  dismissInboxItem,
  acknowledgeInboxItem,
  type ResolveInboxItemInput,
  type DismissInboxItemInput,
  type AcknowledgeInboxItemInput,
} from "@/modules/inbox/application";
import type { ProductActionErrorCode } from "@/modules/tenancy/application/product-action-error";

type Err = { status: "error"; code: ProductActionErrorCode };
type Ok = { status: "success" };

export async function resolveInboxAction(
  input: ResolveInboxItemInput,
): Promise<Ok | Err> {
  const result = await resolveInboxItemToJar(input);
  if (result.ok) return { status: "success" };
  return { status: "error", code: result.code };
}

export async function dismissInboxAction(
  input: DismissInboxItemInput,
): Promise<Ok | Err> {
  const result = await dismissInboxItem(input);
  if (result.ok) return { status: "success" };
  return { status: "error", code: result.code };
}

export async function acknowledgeInboxAction(
  input: AcknowledgeInboxItemInput,
): Promise<Ok | Err> {
  const result = await acknowledgeInboxItem(input);
  if (result.ok) return { status: "success" };
  return { status: "error", code: result.code };
}
