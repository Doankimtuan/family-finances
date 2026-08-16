/**
 * Localize known onboard/system seed labels (DB stores English canonical names).
 * Custom household names fall through unchanged.
 */

import type enCatalog from "@/messages/en/catalog.json";

export const CatalogGroup = {
  ACCOUNTS: "accounts",
  TAGS: "tags",
  JARS: "jars",
} as const;

export type CatalogGroup = (typeof CatalogGroup)[keyof typeof CatalogGroup];

type CatalogKey =
  | `accounts.${keyof typeof enCatalog.accounts}`
  | `tags.${keyof typeof enCatalog.tags}`
  | `jars.${keyof typeof enCatalog.jars}`;

const KNOWN: Record<CatalogGroup, ReadonlySet<string>> = {
  [CatalogGroup.ACCOUNTS]: new Set(["cash"]),
  [CatalogGroup.TAGS]: new Set([
    "food",
    "transport",
    "home",
    "health",
    "other",
    "salary",
    "bonus",
  ]),
  jars: new Set([
    "essentials",
    "lifestyle",
    "buffer",
    "savings",
    "needs",
    "wants",
  ]),
};

export function catalogSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

export function localizeCatalogName(
  t: (key: CatalogKey) => string,
  group: CatalogGroup,
  name: string | null | undefined,
): string {
  if (!name) return "";
  const slug = catalogSlug(name);
  if (!KNOWN[group].has(slug)) {
    return name;
  }
  return t(`${group}.${slug}` as CatalogKey);
}
