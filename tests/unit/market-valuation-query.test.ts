import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const querySource = readFileSync(
  resolve(
    process.cwd(),
    "modules/investments/application/queries/investment-queries.ts",
  ),
  "utf8",
);

describe("market valuation query shape", () => {
  it("bulk-loads market data with fixed query count", () => {
    expect(querySource.match(/\.from\("market_instruments"\)/g)).toHaveLength(
      1,
    );
    expect(
      querySource.match(/\.from\("market_instrument_prices"\)/g),
    ).toHaveLength(1);
    expect(
      querySource.match(/\.from\("market_currency_rates"\)/g),
    ).toHaveLength(1);
    expect(querySource).toContain("const instrumentIds = [");
    expect(querySource).toContain("...new Set(");
  });
});
