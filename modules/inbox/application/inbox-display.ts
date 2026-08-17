/**
 * Display helpers for Inbox ReviewItems — prefer real tx details over generic
 * titles (Prompt 13A: one canonical taxonomy; no per-kind legacy titles).
 */

export function isBlankTitle(title: string | null | undefined): boolean {
  return title == null || title.trim().length === 0;
}

/**
 * Prefer note → category → non-blank stored title → empty (UI falls back to
 * the canonical kind label).
 */
export function resolveInboxDisplayTitle(input: {
  storedTitle: string;
  note: string | null | undefined;
  categoryName: string | null | undefined;
}): string {
  const note = input.note?.trim();
  if (note) return note;

  const category = input.categoryName?.trim();
  if (category) return category;

  if (!isBlankTitle(input.storedTitle)) {
    return input.storedTitle.trim();
  }

  return "";
}
