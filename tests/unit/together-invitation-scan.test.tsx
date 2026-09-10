import type { ReactElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import enNavigation from "@/messages/en/navigation.json";
import viNavigation from "@/messages/vi/navigation.json";
import enTogether from "@/messages/en/together.json";
import viTogether from "@/messages/vi/together.json";
import viSettings from "@/messages/vi/settings.json";
import viSystem from "@/messages/vi/system.json";
import type { PendingInvitation } from "@/modules/tenancy/application/list-pending-invitations";
import { APP_PATH } from "@/modules/tenancy/application/tenancy-constants";
import { StatusAlertProvider } from "@/providers/status-alert-provider";
import { ButtonVariant } from "@/shared/ui/button";
import { SectionHeader } from "@/shared/patterns/section-header";
import { InvitationsPanel } from "@/app/[locale]/(product)/together/invitations/invitations-panel";

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/(product)/together/invite-actions", () => ({
  revokeInvitationAction: vi.fn(),
}));

const firstInvitation: PendingInvitation = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  email: "partner@example.com",
  token: "token-partner",
  expiresAt: "2026-12-01T00:00:00.000Z",
  createdAt: "2026-09-01T00:00:00.000Z",
};

const secondInvitation: PendingInvitation = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  email: "second.partner@example.com",
  token: "token-second",
  expiresAt: "2026-12-02T00:00:00.000Z",
  createdAt: "2026-09-02T00:00:00.000Z",
};

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

function TogetherMembersCatalogCopy() {
  const t = useTranslations("together");
  return (
    <SectionHeader
      title={t("membersTitle")}
      description={t("membersDescription")}
    />
  );
}

function TogetherGoHomeCopy() {
  const t = useTranslations("together.accept");
  return <button type="button">{t("goHome")}</button>;
}

function renderTogetherCopy(locale: "en" | "vi") {
  return render(
    <NextIntlClientProvider
      locale={locale}
      messages={{ together: locale === "vi" ? viTogether : enTogether }}
    >
      <TogetherMembersCatalogCopy />
      <TogetherGoHomeCopy />
    </NextIntlClientProvider>,
  );
}

function renderPanel(
  invitations: PendingInvitation[] = [firstInvitation],
  locale: "en" | "vi" = "en",
) {
  const ui: ReactElement = (
    <NextIntlClientProvider
      locale={locale}
      messages={{ together: locale === "vi" ? viTogether : enTogether }}
    >
      <StatusAlertProvider>
        <InvitationsPanel initialInvitations={invitations} />
      </StatusAlertProvider>
    </NextIntlClientProvider>
  );
  return render(ui);
}

describe("Together invitation scan hierarchy (B15)", () => {
  it("renders pending invitations as compact rows with one dominant next step", () => {
    renderPanel();

    const row = screen.getByTestId("together-invitation-row");
    const copy = screen.getByTestId("invite-copy");
    const revoke = screen.getByTestId("invite-revoke");

    expect(screen.getByTestId("together-invitation-list")).toBeInTheDocument();
    expect(row).toHaveTextContent(firstInvitation.email);
    expect(row).toHaveTextContent(enTogether.invitations.pendingTitle);
    expect(copy).toHaveTextContent(enTogether.invitations.copyLink);
    expect(copy).toHaveClass("flex-1", `button--${ButtonVariant.SECONDARY}`);
    expect(copy).not.toHaveClass("w-full");
    expect(revoke).toHaveTextContent(enTogether.invitations.revoke);
    expect(revoke).toHaveClass(`button--${ButtonVariant.GHOST}`, "shrink-0");
    expect(revoke).not.toHaveClass(`button--${ButtonVariant.DANGER}`, "w-full");
    expect(
      screen.queryByTestId("invite-revoke-confirm"),
    ).not.toBeInTheDocument();
  });

  it("keeps multiple invitations independently scannable", () => {
    renderPanel([firstInvitation, secondInvitation]);

    const rows = screen.getAllByTestId("together-invitation-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent(firstInvitation.email);
    expect(rows[1]).toHaveTextContent(secondInvitation.email);
    expect(screen.getAllByTestId("invite-copy")).toHaveLength(2);
    expect(screen.getAllByTestId("invite-revoke")).toHaveLength(2);
    expect(screen.getByTestId("together-invitation-list").tagName).toBe("DIV");
  });

  it("keeps the empty state calm without warning-card framing", () => {
    renderPanel([]);

    expect(
      screen.getByRole("heading", { name: enTogether.invitations.emptyTitle }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(enTogether.invitations.emptyDescription).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByTestId("together-invitation-list"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("invite-copy")).not.toBeInTheDocument();
    expect(screen.queryByTestId("invite-revoke")).not.toBeInTheDocument();
  });

  it("keeps revoke as a secondary action that still opens the B05 confirmation", () => {
    renderPanel();

    fireEvent.click(screen.getByTestId("invite-revoke"));

    expect(screen.getByTestId("invite-revoke-confirm")).toBeVisible();
    expect(screen.getByTestId("invite-revoke-target")).toHaveTextContent(
      firstInvitation.email,
    );
    expect(
      screen.getByText(enTogether.invitations.revokeConfirmDescription),
    ).toBeInTheDocument();
  });

  it("resolves Vietnamese invitation copy without raw keys", () => {
    renderPanel([firstInvitation], "vi");

    expect(
      screen.getAllByText(viTogether.invitations.pendingTitle).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: viTogether.invitations.copyLink }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: viTogether.invitations.revoke }),
    ).toBeInTheDocument();
    expect(screen.queryByText("copyLink")).not.toBeInTheDocument();
    expect(screen.queryByText("pendingTitle")).not.toBeInTheDocument();
  });

  it("does not restyle pending invitations as warning cards or stacked equal CTAs", () => {
    const panel = readProjectFile(
      "app/[locale]/(product)/together/invitations/invitations-panel.tsx",
    );
    const confirm = readProjectFile(
      "app/[locale]/(product)/together/invitations/invite-revoke-confirm-sheet.tsx",
    );
    const actions = readProjectFile(
      "app/[locale]/(product)/together/invite-actions.ts",
    );

    expect(panel).toContain('tone="elevated"');
    expect(panel).not.toContain('tone="warning"');
    expect(panel).toContain("ButtonVariant.SECONDARY");
    expect(panel).toContain("ButtonVariant.GHOST");
    expect(panel).not.toContain("ButtonVariant.DANGER");
    expect(panel).toContain("InviteRevokeConfirmSheet");
    expect(panel).toContain("revokeInvitationAction");
    expect(confirm).toContain("ButtonVariant.DANGER");
    expect(actions).toContain("revokeInvitation(");
  });
});

describe("Together terminology localization (B15)", () => {
  it("uses the established navigation label for Together header copy", () => {
    expect(enTogether.header.eyebrow).toBe(enNavigation.together);
    expect(viTogether.header.eyebrow).toBe(viNavigation.together);
    expect(enTogether.title).toBe(enNavigation.together);
    expect(viTogether.title).toBe(viNavigation.together);
  });

  it("keeps Together screens on translation keys rather than hard-coded English labels", () => {
    const overview = readProjectFile(
      "app/[locale]/(product)/together/page.tsx",
    );
    const loading = readProjectFile(
      "app/[locale]/(product)/together/together-loading-skeleton.tsx",
    );

    expect(overview).toContain('eyebrow={t("header.eyebrow")}');
    expect(loading).toContain('eyebrow={t("header.eyebrow")}');
    expect(overview).not.toContain('eyebrow="Together"');
    expect(loading).not.toContain('eyebrow="Together"');
  });

  it("localizes Together terminology in Vietnamese Together surfaces", () => {
    const togetherCopy = collectStrings(viTogether);
    const settingsCopy = collectStrings(viSettings);
    const systemCopy = collectStrings(viSystem);

    expect(togetherCopy.join("\n")).not.toMatch(
      /\b(?:Together|Money|Plan|Inbox|Home)\b/,
    );
    expect(settingsCopy.join("\n")).not.toMatch(/\bTogether\b/);
    expect(systemCopy.join("\n")).not.toMatch(/\bTogether\b/);
    expect(viTogether.accept.goTogether).toBe(`Mở ${viNavigation.together}`);
    expect(viSystem.permission.backTogether).toBe(
      `Về ${viNavigation.together}`,
    );
  });

  it("reuses navigation product labels in Together catalog copy", () => {
    expect(enTogether.membersDescription).toBe(
      `Partners share daily ${enNavigation.money}, ${enNavigation.plan}, and ${enNavigation.inbox}.`,
    );
    expect(viTogether.membersDescription).toBe(
      `Đối tác chia sẻ quyền ${viNavigation.money}, ${viNavigation.plan} và ${viNavigation.inbox} hằng ngày.`,
    );
    expect(enTogether.accept.goHome).toBe(`Go to ${enNavigation.home}`);
    expect(viTogether.accept.goHome).toBe(`Vào ${viNavigation.home}`);
  });

  it("renders localized Together catalog product labels without leaking English in VI", () => {
    renderTogetherCopy("vi");

    expect(screen.getByText(viTogether.membersTitle)).toBeInTheDocument();
    expect(screen.getByText(viTogether.membersDescription)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: viTogether.accept.goHome }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\bMoney\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bPlan\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bInbox\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bHome\b/)).not.toBeInTheDocument();
  });

  it("keeps English Together catalog product labels unchanged", () => {
    renderTogetherCopy("en");

    expect(screen.getByText(enTogether.membersDescription)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: enTogether.accept.goHome }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\bMoney\b/)).toBeInTheDocument();
    expect(screen.getByText(/\bPlan\b/)).toBeInTheDocument();
    expect(screen.getByText(/\bInbox\b/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /\bHome\b/ }),
    ).toBeInTheDocument();
  });

  it("does not localize Together product identifiers or routes", () => {
    const overview = readProjectFile(
      "app/[locale]/(product)/together/page.tsx",
    );
    const accept = readProjectFile(
      "app/[locale]/(invite)/invite/[token]/invite-accept-screen.tsx",
    );

    expect(overview).toContain("TOGETHER_PATH.MEMBERS");
    expect(overview).toContain("TOGETHER_PATH.INVITATIONS");
    expect(overview).toContain("TOGETHER_PATH.POLICIES");
    expect(overview).toContain("TOGETHER_PATH.SETTINGS");
    expect(overview).not.toContain("TOGETHER_PATH.PREFERENCES");
    expect(overview).toContain('description={t("membersDescription")}');
    expect(accept).toContain('t("goHome")');
    expect(accept).toContain("APP_PATH.WELCOME");
    expect(accept).toContain("APP_PATH.TOGETHER");
    expect(APP_PATH.HOME).toBe("/home");
    expect(APP_PATH.MONEY).toBe("/money");
    expect(APP_PATH.PLAN).toBe("/plan");
    expect(APP_PATH.INBOX).toBe("/inbox");
    expect(APP_PATH.TOGETHER).toBe("/together");
  });
});
