import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));
vi.mock("@/i18n/set-locale", () => ({ setLocale: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({
  Link: () => null,
  redirect: vi.fn(),
}));
vi.mock("@/modules/tenancy/application/get-session-user", () => ({
  getSessionUser: vi.fn(async () => ({ id: "user-1" })),
}));
vi.mock("@/modules/tenancy/application/resolve-active-membership", () => ({
  resolveActiveMembership: vi.fn(async () => ({ id: "membership-1" })),
}));
vi.mock("@/app/[locale]/(product)/money/money-offline-banner", () => ({
  MoneyOfflineBanner: () => null,
}));
vi.mock("@/modules/savings/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/modules/savings/application")>();
  return {
    ...actual,
    listSavings: vi.fn(),
    detectMaturedSavings: vi.fn(),
    backfillLegacySavingsAccounts: vi.fn(),
    syncSavingsLifecycle: vi.fn(),
  };
});

import SavingsPage from "@/app/[locale]/(product)/money/savings/page";
import SavingsLayout from "@/app/[locale]/(product)/money/savings/layout";
import {
  listSavings,
  detectMaturedSavings,
  backfillLegacySavingsAccounts,
  syncSavingsLifecycle,
} from "@/modules/savings/application";
import { SAVINGS_RPC } from "@/modules/savings/application/savings-constants";

const SAVINGS_APP_DIR = join(
  process.cwd(),
  "app/[locale]/(product)/money/savings",
);

const LIFECYCLE_MUTATION_MARKERS = [
  "SavingsLifecycleSync",
  "syncSavingsLifecycleAction",
  "syncSavingsLifecycle(",
  "backfillLegacySavingsAction",
  "detectMaturedSavingsAction",
  "acknowledgeSavingsMaturityAction",
  SAVINGS_RPC.BACKFILL_LEGACY,
  SAVINGS_RPC.DETECT_MATURED,
  SAVINGS_RPC.ENQUEUE_MATURITY_CASCADE,
] as const;

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkTsFiles(full));
    } else if (name.endsWith(".ts") || name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

function isSavingsReadPathFile(file: string): boolean {
  const relative = file.slice(SAVINGS_APP_DIR.length).replaceAll("\\", "/");
  return (
    relative.endsWith("/page.tsx") ||
    relative.endsWith("/layout.tsx") ||
    relative.endsWith("/loading.tsx")
  );
}

describe("Savings page render purity", () => {
  beforeEach(() => {
    vi.mocked(listSavings).mockResolvedValue([]);
  });

  it("renders the page without mutating savings lifecycle state", async () => {
    const page = await SavingsPage({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(page).toBeTruthy();
    expect(listSavings).toHaveBeenCalledTimes(1);
    expect(detectMaturedSavings).not.toHaveBeenCalled();
    expect(backfillLegacySavingsAccounts).not.toHaveBeenCalled();
    expect(syncSavingsLifecycle).not.toHaveBeenCalled();

    const layout = SavingsLayout({ children: page });
    expect(layout).toBe(page);
    expect(syncSavingsLifecycle).not.toHaveBeenCalled();
    expect(detectMaturedSavings).not.toHaveBeenCalled();
    expect(backfillLegacySavingsAccounts).not.toHaveBeenCalled();
  });

  it("does not mount lifecycle mutations on the Savings GET tree", () => {
    expect(existsSync(join(SAVINGS_APP_DIR, "layout.tsx"))).toBe(true);
    expect(
      existsSync(join(SAVINGS_APP_DIR, "savings-lifecycle-sync.tsx")),
    ).toBe(false);

    const readPathFiles = walkTsFiles(SAVINGS_APP_DIR).filter(
      isSavingsReadPathFile,
    );
    expect(readPathFiles.some((file) => file.endsWith("/layout.tsx"))).toBe(
      true,
    );
    expect(readPathFiles.some((file) => file.endsWith("/page.tsx"))).toBe(true);

    for (const file of readPathFiles) {
      const source = readFileSync(file, "utf8");
      for (const marker of LIFECYCLE_MUTATION_MARKERS) {
        expect(source, `${file} must not contain ${marker}`).not.toContain(
          marker,
        );
      }
    }
  });
});
