import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("header and sheet polish contracts", () => {
  it("keeps Money on the compact shared product header", () => {
    const moneyPage = readProjectFile("app/[locale]/(product)/money/page.tsx");
    const moneyLoading = readProjectFile(
      "app/[locale]/(product)/money/loading.tsx",
    );

    for (const source of [moneyPage, moneyLoading]) {
      expect(source).toContain('variant="primary"');
      expect(source).toContain('title={t("title")}');
      expect(source).not.toContain("header.headline");
      expect(source).not.toContain("header.supporting");
    }
  });

  it("keeps Home's identity mark decorative and outside the title", () => {
    const homePage = readProjectFile("app/[locale]/(product)/home/page.tsx");
    const homeLoading = readProjectFile(
      "app/[locale]/(product)/home/loading.tsx",
    );

    for (const source of [homePage, homeLoading]) {
      expect(source).toContain(
        'trailing={<BrandMark variant="mark" size="sm" />}',
      );
      expect(source).not.toContain(
        'BrandMark variant="mark" size="sm" className',
      );
    }
  });

  it("defines sheet footer breathing room as a shared token", () => {
    const tokens = readProjectFile("styles/globals.css");
    const footer = readProjectFile("shared/patterns/action-sheet-layout.tsx");

    expect(tokens).toContain("--sheet-footer-space: var(--space-4);");
    expect(footer).toContain(
      "pb-[calc(var(--sheet-footer-space)+env(safe-area-inset-bottom,0px))]",
    );
  });
});
