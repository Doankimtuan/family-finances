import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("Next.js development logging security", () => {
  it("suppresses server function argument diagnostics without disabling other logs", () => {
    expect(nextConfig).toMatchObject({
      logging: {
        serverFunctions: false,
      },
    });
    expect(nextConfig.logging).not.toBe(false);
  });
});
