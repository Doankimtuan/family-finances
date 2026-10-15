import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

describe("E2E fixture stdout", () => {
  it("keeps setup diagnostics without exposing credentials on either setup path", () => {
    const source = readFileSync("scripts/e2e-auth-fixture.mjs", "utf8");
    const writes = source.match(/process\.stdout\.write\([\s\S]*?\);/g) ?? [];
    const fixture = {
      email: "fixture@example.invalid",
      password: "synthetic-secret-never-log",
      userId: "fixture-user",
      householdId: "fixture-household",
      access_token: "synthetic-token-never-log",
    };
    const output: string[] = [];

    expect(writes).toHaveLength(2);
    for (const write of writes) {
      runInNewContext(write, {
        existing: fixture,
        state: fixture,
        process: { stdout: { write: (value: string) => output.push(value) } },
      });
    }

    for (const line of output) {
      expect(JSON.parse(line)).toEqual({
        email: fixture.email,
        userId: fixture.userId,
        householdId: fixture.householdId,
      });
      expect(line).not.toContain(fixture.password);
      expect(line).not.toContain(fixture.access_token);
    }
  });
});
