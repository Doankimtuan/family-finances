import { randomBytes } from "node:crypto";

const ARTIFACT_ID_RE = /^art_[A-Za-z0-9][A-Za-z0-9_-]*$/;

/** Generate a durable artifact id: `art_` + time + entropy (sortable-ish). */
export function createArtifactId(slug?: string): string {
  const time = Date.now().toString(36);
  const entropy = randomBytes(8).toString("hex");
  if (slug) {
    const clean = slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
    if (clean.length >= 2) {
      return `art_${clean}_${time}${entropy.slice(0, 6)}`;
    }
  }
  return `art_${time}${entropy}`;
}

export function assertArtifactId(id: string): asserts id is `art_${string}` {
  if (!ARTIFACT_ID_RE.test(id)) {
    throw new Error(`Invalid artifact id: ${id}`);
  }
}

export function isArtifactId(id: string): boolean {
  return ARTIFACT_ID_RE.test(id);
}
