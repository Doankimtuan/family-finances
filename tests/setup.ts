import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

import React from "react";

/** Next.js `server-only` throws in non-RSC contexts; unit tests import leaves. */
vi.mock("server-only", () => ({}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string | { pathname?: string };
    prefetch?: boolean;
  }) =>
    React.createElement(
      "a",
      {
        href: typeof href === "string" ? href : (href?.pathname ?? "#"),
        ...props,
      },
      children,
    ),
  redirect: vi.fn(),
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  getPathname: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));
