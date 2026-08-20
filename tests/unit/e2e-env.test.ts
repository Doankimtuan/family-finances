import {
  assertE2EEnvironmentPolicy,
  getE2ECredentials,
  getE2EEnvironmentStatus,
} from "@/tests/e2e/support/env";

describe("E2E environment bootstrap", () => {
  it("returns trimmed email and preserves password", () => {
    expect(
      getE2ECredentials({
        E2E_USER_EMAIL: "  e2e@example.com  ",
        E2E_USER_PASSWORD: " pass with spaces ",
      }),
    ).toEqual({
      email: "e2e@example.com",
      password: " pass with spaces ",
    });
  });

  it("reports presence without exposing values", () => {
    expect(
      getE2EEnvironmentStatus({
        E2E_USER_EMAIL: "e2e@example.com",
        E2E_USER_PASSWORD: "secret",
      }),
    ).toEqual({
      envLoaded: true,
      emailPresent: true,
      passwordPresent: true,
    });
  });

  it("rejects missing email and password without including secrets", () => {
    expect.assertions(5);
    expect(() => getE2ECredentials({ E2E_USER_PASSWORD: "secret" })).toThrow(
      /E2E_USER_EMAIL/,
    );
    expect(() =>
      getE2ECredentials({ E2E_USER_EMAIL: "e2e@example.com" }),
    ).toThrow(/E2E_USER_PASSWORD/);
    expect(() => getE2ECredentials({})).toThrow(
      /E2E authentication credentials are not configured/,
    );
    try {
      getE2ECredentials({ E2E_USER_PASSWORD: "secret" });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).not.toContain("secret");
    }
  });

  it("fails loudly for partial configuration", () => {
    expect(() =>
      assertE2EEnvironmentPolicy({ E2E_USER_EMAIL: "e2e@example.com" }),
    ).toThrow(/partially configured/);
  });
});
