import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MESSAGE_NAMESPACES } from "@/i18n/load-messages";

const root = join(process.cwd(), "messages");

function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(
    ([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        return flattenKeys(value, path);
      }
      return [path];
    },
  );
}

describe("i18n message catalogs", () => {
  it("has matching namespace files for en and vi", () => {
    const enFiles = readdirSync(join(root, "en")).sort();
    const viFiles = readdirSync(join(root, "vi")).sort();
    expect(enFiles).toEqual(viFiles);
    expect(enFiles.map((f) => f.replace(/\.json$/, ""))).toEqual(
      [...MESSAGE_NAMESPACES].sort(),
    );
  });

  it("keeps en/vi key parity for every namespace", () => {
    for (const ns of MESSAGE_NAMESPACES) {
      const en = JSON.parse(
        readFileSync(join(root, "en", `${ns}.json`), "utf8"),
      ) as unknown;
      const vi = JSON.parse(
        readFileSync(join(root, "vi", `${ns}.json`), "utf8"),
      ) as unknown;
      expect(flattenKeys(vi).sort(), ns).toEqual(flattenKeys(en).sort());
    }
  });

  it("includes required bootstrap keys", () => {
    const required: Record<string, string[]> = {
      common: ["brand", "tagline", "loading"],
      navigation: ["home", "money", "plan", "inbox", "together"],
      buttons: ["openApp"],
      emptyStates: ["homeTitle", "moneyTitle"],
      errors: ["generic"],
      a11y: ["primaryNav", "back", "localeSwitcher"],
      metadata: ["title", "description"],
    };

    for (const [ns, keys] of Object.entries(required)) {
      const en = JSON.parse(
        readFileSync(join(root, "en", `${ns}.json`), "utf8"),
      ) as Record<string, string>;
      for (const key of keys) {
        expect(en[key], `${ns}.${key}`).toBeTruthy();
      }
    }
  });
});
