import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireProductSessionMock } = vi.hoisted(() => ({
  requireProductSessionMock: vi.fn(async () => undefined),
}));

vi.mock("@/modules/tenancy/application/require-product-session", () => ({
  requireProductSession: requireProductSessionMock,
}));
vi.mock("@/shared/patterns/chrome-shell", () => ({
  ChromeShell: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/shared/patterns/bottom-navigation", () => ({
  BottomNavigation: () => null,
}));
vi.mock("@/shared/patterns/product-route-transition", () => ({
  ProductRouteTransition: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/modules/inbox/application", () => ({
  countUnreadOpenInboxItems: vi.fn(async () => 0),
}));

import ProductLayout from "@/app/[locale]/(product)/layout";
import { routing } from "@/i18n/routing";

describe("product layout auth boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls requireProductSession before rendering product chrome", async () => {
    await ProductLayout({
      children: null,
      params: Promise.resolve({ locale: routing.locales[0] }),
    });

    expect(requireProductSessionMock).toHaveBeenCalledWith({
      localeParam: routing.locales[0],
    });
  });

  it("does not render product chrome when the session gate redirects", async () => {
    requireProductSessionMock.mockImplementationOnce(async () => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      ProductLayout({
        children: null,
        params: Promise.resolve({ locale: routing.locales[1] }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(requireProductSessionMock).toHaveBeenCalledWith({
      localeParam: routing.locales[1],
    });
  });
});
