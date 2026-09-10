import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { OAuthProvider } from "@/modules/tenancy/application/oauth.schema";
import { PlanPreset } from "@/modules/tenancy/application/create-household.schema";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { AuthTextField } from "@/shared/ui/form";

const { pushMock, replaceMock, loginActionMock, createHouseholdActionMock } =
  vi.hoisted(() => ({
    pushMock: vi.fn(),
    replaceMock: vi.fn(),
    loginActionMock: vi.fn(),
    createHouseholdActionMock: vi.fn(),
  }));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace?: string) => {
    const t = (key: string, params?: Record<string, unknown>) => {
      const path = namespace ? `${namespace}.${key}` : key;
      if (params?.current !== undefined) {
        return `${path}:${params.current}:${params.total}`;
      }
      if (params?.min !== undefined) {
        return `${path}:${params.min}`;
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

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/providers/status-alert-provider", () => ({
  useStatusAlert: () => ({ show: vi.fn(), hide: vi.fn() }),
}));

vi.mock("@/app/[locale]/(auth)/login/actions", () => ({
  loginAction: loginActionMock,
}));

vi.mock("@/app/[locale]/(onboard)/together/onboard/actions", () => ({
  createHouseholdAction: createHouseholdActionMock,
}));

vi.mock("@/modules/tenancy/application/start-browser-oauth-sign-in", () => ({
  authConfirmRedirectUrl: () => "http://localhost/auth/confirm",
  startBrowserOAuthSignIn: vi.fn(),
}));

vi.mock("@/shared/motion/use-motion-policy", () => ({
  useMotionPolicy: () => ({
    mounted: true,
    reducedMotion: true,
    lowEnd: false,
    enabled: false,
  }),
}));

import { WelcomeScreen } from "@/app/[locale]/(auth)/welcome/welcome-screen";
import { LoginScreen } from "@/app/[locale]/(auth)/login/login-screen";
import { RegisterScreen } from "@/app/[locale]/(auth)/register/register-screen";
import { ForgotPasswordScreen } from "@/app/[locale]/(auth)/forgot-password/forgot-password-screen";
import { OnboardWizardScreen } from "@/app/[locale]/(onboard)/together/onboard/onboard-wizard-screen";

function renderOnboard() {
  return render(
    <FinancialPrivacyProvider>
      <OnboardWizardScreen />
    </FinancialPrivacyProvider>,
  );
}

describe("Welcome S1 hierarchy", () => {
  it("keeps Create account primary, Log in secondary, and a decorative preview", () => {
    render(<WelcomeScreen />);

    const createAccount = screen.getByRole("button", {
      name: "auth.welcome.register",
    });
    const logIn = screen.getByRole("button", { name: "auth.welcome.login" });
    expect(createAccount.compareDocumentPosition(logIn)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    fireEvent.click(createAccount);
    expect(pushMock).toHaveBeenCalledWith(APP_PATH.REGISTER);
    fireEvent.click(logIn);
    expect(pushMock).toHaveBeenCalledWith(APP_PATH.LOGIN);

    const preview = screen
      .getByText("auth.welcome.previewBadge")
      .closest("[aria-hidden]");
    expect(preview).toBeTruthy();
  });
});

describe("Login S1 hierarchy", () => {
  it("renders OAuth before email and links to forgot-password and register", () => {
    render(<LoginScreen />);

    const google = screen.getByTestId("oauth-google");
    const apple = screen.getByTestId("oauth-apple");
    const email = screen.getByLabelText("auth.login.emailLabel");
    expect(google.compareDocumentPosition(apple)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(apple.compareDocumentPosition(email)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    expect(
      screen.getByRole("link", { name: "auth.login.forgot" }),
    ).toHaveAttribute("href", APP_PATH.FORGOT_PASSWORD);
    expect(
      screen.getByRole("link", { name: "auth.login.register" }),
    ).toHaveAttribute("href", APP_PATH.REGISTER);
  });

  it("shows field errors under the relevant inputs", async () => {
    render(<LoginScreen />);

    fireEvent.click(screen.getByRole("button", { name: "auth.login.submit" }));

    expect(await screen.findByText("validation.invalidEmail")).toBeVisible();
    expect(screen.getByText("validation.required")).toBeVisible();
  });

  it("swaps the submit label and disables competing actions while pending", async () => {
    loginActionMock.mockImplementation(() => new Promise(() => undefined));
    render(<LoginScreen />);

    fireEvent.change(screen.getByLabelText("auth.login.emailLabel"), {
      target: { value: "member@example.com" },
    });
    fireEvent.change(screen.getByLabelText("auth.login.passwordLabel"), {
      target: { value: "password12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "auth.login.submit" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "auth.login.submitting" }),
      ).toBeDisabled();
    });
    expect(screen.getByTestId("oauth-google")).toBeDisabled();
    expect(screen.getByTestId("oauth-apple")).toBeDisabled();
    expect(
      screen.getByRole("link", { name: "auth.login.forgot" }),
    ).toHaveAttribute("aria-disabled", "true");
  });
});

describe("Register and forgot-password S1 family", () => {
  it("keeps register OAuth-first with auth-critical fields only", () => {
    render(<RegisterScreen />);

    const google = screen.getByTestId("oauth-google");
    const apple = screen.getByTestId("oauth-apple");
    expect(google.compareDocumentPosition(apple)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByLabelText("auth.register.emailLabel")).toBeVisible();
    expect(screen.getByLabelText("auth.register.passwordLabel")).toBeVisible();
    expect(
      screen.getByLabelText("auth.register.confirmPasswordLabel"),
    ).toBeVisible();
    expect(screen.getByText("auth.register.passwordHint")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "auth.register.login" }),
    ).toHaveAttribute("href", APP_PATH.LOGIN);
  });

  it("keeps forgot-password in the auth family with back navigation to login", () => {
    render(<ForgotPasswordScreen />);

    expect(screen.getByTestId("auth-forgot-password")).toBeVisible();
    expect(
      screen.getByLabelText("auth.forgotPassword.emailLabel"),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "auth.forgotPassword.submit" }),
    ).toBeVisible();
    const backLinks = screen.getAllByRole("link", {
      name: "auth.forgotPassword.backToLogin",
    });
    expect(backLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of backLinks) {
      expect(link).toHaveAttribute("href", APP_PATH.LOGIN);
    }
  });
});

describe("Password reveal", () => {
  it("is keyboard accessible with a 44px hit target", () => {
    render(
      <AuthTextField
        id="reveal-password"
        label="Password"
        type="password"
        revealable
        revealShowLabel="Show password"
        revealHideLabel="Hide password"
      />,
    );

    const reveal = screen.getByRole("button", { name: "Show password" });
    expect(reveal).not.toHaveAttribute("tabindex", "-1");
    expect(reveal).toHaveClass("size-11");
    fireEvent.click(reveal);
    expect(screen.getByRole("button", { name: "Hide password" })).toBeVisible();
  });
});

describe("Onboarding two-step flow", () => {
  beforeEach(() => {
    createHouseholdActionMock.mockReset();
  });

  it("starts on step 1 of 2 and continues to jar choices", async () => {
    renderOnboard();

    expect(screen.getByText("onboard.stepOf:1:2")).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 1, name: "onboard.step1Title" }),
    ).toBeVisible();

    fireEvent.click(screen.getByTestId("onboard-next"));
    expect(await screen.findByText("validation.required")).toBeVisible();

    fireEvent.change(screen.getByLabelText("onboard.householdNameLabel"), {
      target: { value: "Our household" },
    });
    fireEvent.click(screen.getByTestId("onboard-next"));

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "onboard.step2Title",
      }),
    ).toBeVisible();
    expect(screen.getByText("onboard.stepOf:2:2")).toBeVisible();

    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBeGreaterThanOrEqual(3);
    expect(
      screen.getByTestId(`onboard-plan-${PlanPreset.BALANCED}`),
    ).toHaveAttribute("aria-checked", "true");

    fireEvent.click(screen.getByTestId("onboard-plan-set-up-later"));
    expect(screen.getByTestId("onboard-plan-set-up-later")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "onboard.back" }));
    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "onboard.step1Title",
      }),
    ).toBeVisible();
    expect(screen.getByLabelText("onboard.householdNameLabel")).toHaveValue(
      "Our household",
    );
  });

  it("keeps skip secondary and submits without an account or jar preset", async () => {
    createHouseholdActionMock.mockResolvedValue({
      status: "error",
      code: "unknown",
    });
    renderOnboard();

    fireEvent.change(screen.getByLabelText("onboard.householdNameLabel"), {
      target: { value: "Our household" },
    });
    fireEvent.click(screen.getByTestId("onboard-next"));
    const finish = await screen.findByTestId("onboard-finish");
    const skip = screen.getByTestId("onboard-skip-account");

    expect(finish.compareDocumentPosition(skip)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    fireEvent.click(skip);
    await waitFor(() => {
      expect(createHouseholdActionMock).toHaveBeenCalled();
    });
    expect(createHouseholdActionMock.mock.calls[0]?.[0]).toMatchObject({
      name: "Our household",
      planPreset: null,
    });
    expect(
      createHouseholdActionMock.mock.calls[0]?.[0].accountName,
    ).toBeUndefined();
  });

  it("submits finish with the existing household contract", async () => {
    createHouseholdActionMock.mockResolvedValue({
      status: "error",
      code: "unknown",
    });
    renderOnboard();

    fireEvent.change(screen.getByLabelText("onboard.householdNameLabel"), {
      target: { value: "Our household" },
    });
    fireEvent.click(screen.getByTestId("onboard-next"));
    await screen.findByTestId("onboard-finish");
    fireEvent.click(screen.getByTestId("onboard-finish"));

    await waitFor(() => {
      expect(createHouseholdActionMock).toHaveBeenCalled();
    });
    expect(createHouseholdActionMock.mock.calls[0]?.[0]).toMatchObject({
      name: "Our household",
      planPreset: PlanPreset.BALANCED,
    });
  });
});

describe("OAuth provider constants", () => {
  it("keeps Google then Apple as the implemented providers", () => {
    expect(OAuthProvider.GOOGLE).toBe("google");
    expect(OAuthProvider.APPLE).toBe("apple");
  });
});
