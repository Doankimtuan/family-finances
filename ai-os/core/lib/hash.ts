import { createHash } from "node:crypto";

export function sha256Hex(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function contentHash(bytes: Buffer | string): `sha256:${string}` {
  return `sha256:${sha256Hex(bytes)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
