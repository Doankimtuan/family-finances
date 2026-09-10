import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { INVITATION_STATUS } from "@/modules/tenancy/application/tenancy-constants";
import {
  AUTH_CONFIRM_ERROR_CODE,
  AUTH_CONFIRM_STATUS,
} from "@/modules/tenancy/application/auth-constants";
import enAuth from "@/messages/en/auth.json";
import viAuth from "@/messages/vi/auth.json";
import enOnboard from "@/messages/en/onboard.json";
import viOnboard from "@/messages/vi/onboard.json";

const { pushMock, replaceMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace?: string) => {
    const t = (key: string, params?: Record<string, unknown>) => {
      const path = namespace ? `${namespace}.${key}` : key;
      if (params?.email !== undefined) {
        return `${path}:${params.email}`;
      }
      if (params?.min !== undefined) {
        return `${path}:${params.min}`;
      }
      if (params?.current !== undefined) {
        return `${path}:${params.current}:${params.total}`;
      }
      return path;
    };
    t.rich = (key: string) => t(key);
    return t;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
    refresh: vi.fn(),
  }),
  usePathname: () => APP_PATH.WELCOME,
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/providers/status-alert-provider", () => ({
  useStatusAlert: () => ({ show: vi.fn(), hide: vi.fn() }),
}));

vi.mock("@/app/[locale]/(auth)/reset-password/actions", () => ({
  updatePasswordAction: vi.fn(),
}));

vi.mock("@/app/[locale]/(product)/together/invite-actions", () => ({
  acceptInvitationAction: vi.fn(),
  declineInvitationAction: vi.fn(),
}));

import { ResetPasswordScreen } from "@/app/[locale]/(auth)/reset-password/reset-password-screen";
import { ConfirmScreen } from "@/app/[locale]/(auth)/auth/confirm/confirm-screen";
import { InviteAcceptScreen } from "@/app/[locale]/(invite)/invite/[token]/invite-accept-screen";
import { WelcomeScreen } from "@/app/[locale]/(auth)/welcome/welcome-screen";

const LOGIN_SCREEN_SOURCE = readFileSync(
  resolve(process.cwd(), "app/[locale]/(auth)/login/login-screen.tsx"),
  "utf8",
);

const WELCOME_SCREEN_SOURCE = readFileSync(
  resolve(process.cwd(), "app/[locale]/(auth)/welcome/welcome-screen.tsx"),
  "utf8",
);

describe("Phase 15 auth presentation", () => {
  it("keeps the login hydration gate in the login screen", () => {
    expect(LOGIN_SCREEN_SOURCE).toContain("busy || !hydrated");
  });

  it("keeps the decorative Welcome preview as an aria-hidden illustration without fake amounts", () => {
    expect(WELCOME_SCREEN_SOURCE).not.toContain("PREVIEW_BALANCE");
    expect(WELCOME_SCREEN_SOURCE).not.toContain("formatCurrency");
    render(<WelcomeScreen />);
    const preview = screen
      .getByText("auth.welcome.previewBadge")
      .closest("[aria-hidden]");
    expect(preview).toBeTruthy();
    expect(screen.getByText("common.brand")).toBeVisible();
    expect(screen.getByText("auth.welcome.previewHint")).toBeVisible();
  });

  it("keeps reset-password fields, hint, and back-to-login", () => {
    render(<ResetPasswordScreen />);

    expect(screen.getByTestId("auth-reset-password")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "auth.resetPassword.title",
      }),
    ).toBeVisible();
    expect(
      screen.getByLabelText("auth.resetPassword.passwordLabel"),
    ).toBeVisible();
    expect(
      screen.getByLabelText("auth.resetPassword.confirmPasswordLabel"),
    ).toBeVisible();
    expect(screen.getByText("auth.resetPassword.passwordHint")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "auth.resetPassword.submit" }),
    ).toBeVisible();

    const backLinks = screen.getAllByRole("link", {
      name: "auth.resetPassword.backToLogin",
    });
    expect(backLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of backLinks) {
      expect(link).toHaveAttribute("href", APP_PATH.LOGIN);
    }
  });

  it("shows field errors under reset-password inputs", async () => {
    render(<ResetPasswordScreen />);
    fireEvent.click(
      screen.getByRole("button", { name: "auth.resetPassword.submit" }),
    );
    expect(await screen.findByText("validation.tooShort:8")).toBeVisible();
    expect(screen.getByText("validation.passwordMismatch")).toBeVisible();
  });

  it("renders confirm success and error without exposing codes as raw tokens", () => {
    const { rerender } = render(
      <ConfirmScreen status={AUTH_CONFIRM_STATUS.OK} />,
    );
    expect(screen.getByText("auth.confirm.successTitle")).toBeVisible();
    rerender(
      <ConfirmScreen
        status={AUTH_CONFIRM_STATUS.ERROR}
        code={AUTH_CONFIRM_ERROR_CODE.INVALID}
      />,
    );
    expect(screen.getByText("auth.confirm.errorTitle")).toBeVisible();
    expect(screen.getByText("auth.confirm.errors.invalid")).toBeVisible();
  });
});

describe("Phase 15 invite presentation", () => {
  const pendingPreview = {
    householdName: "Our household",
    inviteEmail: "member@example.com",
    status: INVITATION_STATUS.PENDING,
    expiresAt: "2099-01-01T00:00:00.000Z",
    isExpired: false,
  };

  it("does not display the invitation token", () => {
    const token = "secret-invite-token";
    render(
      <InviteAcceptScreen
        token={token}
        preview={pendingPreview}
        isAuthenticated={false}
      />,
    );

    expect(screen.getByText("Our household")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "together.accept.title",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "together.accept.signIn" }),
    ).toBeVisible();
    expect(screen.queryByText(token)).not.toBeInTheDocument();
  });
});

describe("Phase 15 EN/VI copy", () => {
  it("keeps auth catalogs aligned for changed welcome, login, and reset keys", () => {
    expect(Object.keys(enAuth.welcome).toSorted()).toEqual(
      Object.keys(viAuth.welcome).toSorted(),
    );
    expect(enAuth.welcome.previewBadge.length).toBeGreaterThan(0);
    expect(viAuth.welcome.previewBadge.length).toBeGreaterThan(0);
    expect(enAuth.login.subtitle.length).toBeGreaterThan(0);
    expect(viAuth.login.subtitle.length).toBeGreaterThan(0);
    expect(enAuth.resetPassword.title.length).toBeGreaterThan(0);
    expect(viAuth.resetPassword.title.length).toBeGreaterThan(0);
  });

  it("keeps onboard catalogs aligned for household, skip, and opening amount", () => {
    expect(Object.keys(enOnboard).toSorted()).toEqual(
      Object.keys(viOnboard).toSorted(),
    );
    expect(enOnboard.skipAccount.length).toBeGreaterThan(0);
    expect(viOnboard.skipAccount.length).toBeGreaterThan(0);
    expect(enOnboard.openingBalanceDescription.toLowerCase()).toContain(
      "not income",
    );
    expect(viOnboard.openingBalanceDescription.toLowerCase()).toContain(
      "thu nhập",
    );
    expect(enOnboard.step2Description.toLowerCase()).toContain("intention");
    expect(viOnboard.step2Description.toLowerCase()).toContain("ý định");
  });
});
