"use server";

import {
  resolveInboxItemToJar,
  dismissInboxItem,
  acknowledgeInboxItem,
  type ResolveInboxItemInput,
  type DismissInboxItemInput,
  type AcknowledgeInboxItemInput,
  type InboxCommandErrorCode,
} from "@/modules/inbox/application";

type Err = { status: "error"; code: InboxCommandErrorCode };
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
