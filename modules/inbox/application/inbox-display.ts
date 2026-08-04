/**
 * Display helpers for Inbox ReviewItems — prefer real tx details over generic titles.
 */

import { InboxItemKind } from "./inbox-constants";

/** DB fallback titles written by record_transaction when note is empty. */
export const InboxGenericTitle = {
  UNMAPPED_EXPENSE: "Unmapped expense",
  PLACE_INCOME: "Place income",
} as const;

export function isGenericInboxTitle(
  title: string,
  kind: InboxItemKind,
): boolean {
  const trimmed = title.trim();
  if (kind === InboxItemKind.UNMAPPED_EXPENSE) {
    return trimmed === InboxGenericTitle.UNMAPPED_EXPENSE;
  }
  if (kind === InboxItemKind.INCOME_SUGGEST) {
    return trimmed === InboxGenericTitle.PLACE_INCOME;
  }
  return false;
}

/**
 * Prefer note → category → non-generic stored title → empty (UI falls back to kind label).
 */
export function resolveInboxDisplayTitle(input: {
  kind: InboxItemKind;
  storedTitle: string;
  note: string | null | undefined;
  categoryName: string | null | undefined;
}): string {
  const note = input.note?.trim();
  if (note) return note;

  const category = input.categoryName?.trim();
  if (category) return category;

  if (
    input.storedTitle.trim() &&
    !isGenericInboxTitle(input.storedTitle, input.kind)
  ) {
    return input.storedTitle.trim();
  }

  return "";
}
