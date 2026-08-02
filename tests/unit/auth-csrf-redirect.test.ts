import { describe, expect, it } from "vitest";
import {
  isAllowedAuthConfirmRedirectTo,
  isSafeInAppNextPath,
} from "@/modules/tenancy/application/auth-redirect";
import { AUTH_ADAPTER_CONFIRM_PATH } from "@/modules/tenancy/application/auth-constants";
import { isTrustedSameOriginMutation } from "@/modules/tenancy/application/assert-same-origin-mutation";
import { HTTP_HEADER } from "@/modules/tenancy/application/auth-constants";
import type { NextRequest } from "next/server";

const TEST_ORIGIN = "http://localhost:3000";

function mockRequest(headers: Record<string, string | null>): NextRequest {
  return {
    nextUrl: { origin: TEST_ORIGIN },
    headers: {
      get(name: string) {
        const key = name.toLowerCase();
        return headers[key] ?? null;
      },
    },
  } as NextRequest;
}

describe("isAllowedAuthConfirmRedirectTo", () => {
  it("allows same-origin confirm adapter", () => {
    expect(
      isAllowedAuthConfirmRedirectTo(
        `${TEST_ORIGIN}${AUTH_ADAPTER_CONFIRM_PATH}`,
        TEST_ORIGIN,
      ),
    ).toBe(true);
  });

  it("rejects other origins and paths", () => {
    expect(
      isAllowedAuthConfirmRedirectTo(
        `https://evil.example${AUTH_ADAPTER_CONFIRM_PATH}`,
        TEST_ORIGIN,
      ),
    ).toBe(false);
    expect(
      isAllowedAuthConfirmRedirectTo(`${TEST_ORIGIN}/login`, TEST_ORIGIN),
    ).toBe(false);
  });
});

describe("isSafeInAppNextPath", () => {
  it("allows absolute in-app paths only", () => {
    expect(isSafeInAppNextPath("/en/home")).toBe(true);
    expect(isSafeInAppNextPath("//evil.example")).toBe(false);
    expect(isSafeInAppNextPath("https://evil.example")).toBe(false);
  });
});

describe("isTrustedSameOriginMutation", () => {
  it("accepts matching Origin", () => {
    expect(
      isTrustedSameOriginMutation(
        mockRequest({ [HTTP_HEADER.ORIGIN]: TEST_ORIGIN }),
      ),
    ).toBe(true);
  });

  it("accepts matching Referer when Origin is absent", () => {
    expect(
      isTrustedSameOriginMutation(
        mockRequest({
          [HTTP_HEADER.ORIGIN]: null,
          [HTTP_HEADER.REFERER]: `${TEST_ORIGIN}/en/together`,
        }),
      ),
    ).toBe(true);
  });

  it("rejects cross-origin or missing provenance", () => {
    expect(
      isTrustedSameOriginMutation(
        mockRequest({ [HTTP_HEADER.ORIGIN]: "https://evil.example" }),
      ),
    ).toBe(false);
    expect(isTrustedSameOriginMutation(mockRequest({}))).toBe(false);
  });
});
