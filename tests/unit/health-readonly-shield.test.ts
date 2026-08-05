import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  asReadOnlySupabaseClient,
  HealthReadOnlyViolationError,
  HEALTH_READONLY_FORBIDDEN_METHODS,
} from "@/modules/platform/supabase/read-only";
import { HEALTH_BC_CONTRACT } from "@/modules/health/application/health-readonly-contract";

/** Patterns that must never appear in Health application sources (AC-HLT-01). */
const FORBIDDEN_SOURCE_PATTERNS = [
  "createSupabaseServerClient",
  "createSupabaseBrowserClient",
  "createSupabaseAdminClient",
  "createSupabaseRouteHandlerClient",
  ".insert(",
  ".update(",
  ".upsert(",
  ".delete(",
  ".rpc(",
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

describe("Health-RO shield (BR-24 / AC-HLT-01)", () => {
  it("contracts forbid direct supabase, commands, and persistence", () => {
    expect(HEALTH_BC_CONTRACT.ALLOWS_DIRECT_SUPABASE).toBe(false);
    expect(HEALTH_BC_CONTRACT.ALLOWS_COMMANDS).toBe(false);
    expect(HEALTH_BC_CONTRACT.ALLOWS_PERSISTENCE).toBe(false);
  });

  it("rejects write methods on the read-only Supabase proxy", () => {
    const fake = {
      from() {
        return {
          select: () => ({ data: [] }),
          insert: () => ({ data: null }),
          update: () => ({ data: null }),
          upsert: () => ({ data: null }),
          delete: () => ({ data: null }),
          rpc: () => ({ data: null }),
        };
      },
    };
    const ro = asReadOnlySupabaseClient(fake);
    const builder = ro.from("accounts") as {
      select: () => unknown;
      insert: () => unknown;
      update: () => unknown;
      upsert: () => unknown;
      delete: () => unknown;
      rpc: () => unknown;
    };

    expect(() => builder.select()).not.toThrow();
    for (const method of HEALTH_READONLY_FORBIDDEN_METHODS) {
      expect(() => (builder[method] as () => unknown)()).toThrow(
        HealthReadOnlyViolationError,
      );
    }
  });

  it("scans modules/health source for forbidden write patterns", () => {
    const root = join(process.cwd(), "modules/health");
    const files = walkTsFiles(root).filter(
      (file) => !file.endsWith("health-readonly-contract.ts"),
    );
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const pattern of FORBIDDEN_SOURCE_PATTERNS) {
        expect(source.includes(pattern)).toBe(false);
      }
    }
  });

  it("does not ship a Health commands directory", () => {
    expect(() =>
      statSync(join(process.cwd(), "modules/health/application/commands")),
    ).toThrow();
  });
});
