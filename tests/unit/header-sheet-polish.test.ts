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

  it("keeps Home on the canonical contextual app header", () => {
    const homePage = [
      "app/[locale]/(product)/home/page.tsx",
      "app/[locale]/(product)/home/home-streaming-sections.tsx",
    ]
      .map(readProjectFile)
      .join("\n");
    const homeLoading = readProjectFile(
      "app/[locale]/(product)/home/loading.tsx",
    );

    for (const source of [homePage, homeLoading]) {
      expect(source).toContain("TopAppBar");
      expect(source).toContain('variant="contextual"');
      expect(source).not.toContain("<header");
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

  it("uses the documented overlay radius on the shared Sheet dialog", () => {
    const sheet = readProjectFile("shared/patterns/sheet.tsx");
    const tokens = readProjectFile("styles/globals.css");

    expect(sheet).toContain("rounded-t-(--radius-overlay)");
    expect(sheet).toContain("vinha-sheet-dialog");
    expect(tokens).toContain(
      "border-start-start-radius: var(--radius-overlay);",
    );
    expect(tokens).toContain("border-start-end-radius: var(--radius-overlay);");
  });

  it("animates the contextual header with the canonical duration token", () => {
    const tokens = readProjectFile("styles/globals.css");

    expect(tokens).toContain(
      "animation: vinha-header-enter var(--duration-normal) var(--ease-standard) both;",
    );
    expect(tokens).not.toContain("--duration-standard");
    expect(tokens).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
