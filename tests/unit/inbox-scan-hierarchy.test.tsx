import type { ComponentProps, ReactElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enInbox from "@/messages/en/inbox.json";
import viInbox from "@/messages/vi/inbox.json";
import enCatalog from "@/messages/en/catalog.json";
import viCatalog from "@/messages/vi/catalog.json";
import { InboxQueueList } from "@/app/[locale]/(product)/inbox/inbox-queue-list";
import {
  InboxQueueListSkeleton,
  InboxQueueSummarySkeleton,
  InboxQueueTabsSkeleton,
} from "@/app/[locale]/(product)/inbox/inbox-queue-skeleton";
import { InboxUnavailable } from "@/app/[locale]/(product)/inbox/inbox-unavailable";
import {
  inboxOwnershipHintKey,
  inboxQueueDominantTitle,
  inboxQueueLifecycleLabel,
  inboxQueueRowSubtitle,
} from "@/app/[locale]/(product)/inbox/inbox-presentations";
import {
  InboxEnrichmentState,
  InboxItemKind,
  InboxItemStatus,
  InboxLifecycleContext,
  InboxSourceType,
  INBOX_TEST_ID,
  inboxGroupTestId,
} from "@/modules/inbox/application/inbox-constants";
import { InboxSourceCapability } from "@/modules/inbox/application/inbox-source-capabilities";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { REVIEW_CARD_TEST_ID } from "@/shared/patterns/review-card";
import { EmptyState } from "@/shared/patterns/empty-state";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/[locale]/(product)/inbox/actions", () => ({
  loadMoreInboxAction: vi.fn(async () => null),
}));

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function reviewItem(overrides: Partial<InboxReviewItem> = {}): InboxReviewItem {
  return {
    id: "550e8400-e29b-41d4-a716-446655440010",
    kind: InboxItemKind.UNMAPPED_EXPENSE,
    status: InboxItemStatus.PENDING,
    title: "Unmapped expense",
    displayTitle: "Lunch",
    amount: 45_000,
    currency: DEFAULT_CURRENCY,
    sourceId: "550e8400-e29b-41d4-a716-446655440011",
    sourceType: InboxSourceType.TRANSACTION,
    createdAt: "2026-09-01T00:00:00Z",
    expiresAt: null,
    lifecycleDate: null,
    lifecycleContext: null,
    lifecycleOverdue: false,
    readAt: null,
    autoResolved: false,
    confidenceScore: null,
    suggestedJarId: null,
    suggestedCategoryId: null,
    note: "Lunch",
    categoryName: "Food",
    accountName: "Cash",
    typed: null,
    intentNote: null,
    executedByUserId: null,
    assignedToUserId: null,
    capability: InboxSourceCapability.ACTIONABLE,
    enrichmentState: InboxEnrichmentState.READY,
    ...overrides,
  };
}

function renderInbox(ui: ReactElement, locale: "en" | "vi" = "en") {
  const inbox = locale === "en" ? enInbox : viInbox;
  const catalog = locale === "en" ? enCatalog : viCatalog;
  return render(
    <NextIntlClientProvider locale={locale} messages={{ inbox, catalog }}>
      <FinancialPrivacyProvider>{ui}</FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

describe("Inbox scan and loading hierarchy (B07)", () => {
  it("keeps one dominant task, compact kind/source metadata, and an unread cue", () => {
    renderInbox(<InboxQueueList items={[reviewItem()]} locale="en" />);

    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByTestId(INBOX_TEST_ID.AMOUNT)).toHaveTextContent(
      "₫45,000",
    );
    expect(screen.getByTestId(REVIEW_CARD_TEST_ID.KIND)).toHaveTextContent(
      enInbox.kinds.unmapped_expense,
    );
    expect(screen.getByText(/Cash · Food/)).toBeInTheDocument();
    expect(screen.getByTestId(REVIEW_CARD_TEST_ID.UNREAD)).toBeInTheDocument();
    expect(
      screen
        .queryByTestId("inbox-item-550e8400-e29b-41d4-a716-446655440010")
        ?.querySelector("[data-slot='status-badge']"),
    ).toBeNull();
    expect(
      screen.getByTestId(
        "inbox-item-link-550e8400-e29b-41d4-a716-446655440010",
      ),
    ).toHaveAttribute(
      "aria-label",
      expect.stringContaining(enInbox.unreadLabel),
    );
  });

  it("keeps ownership metadata in the compact secondary line", () => {
    renderInbox(
      <InboxQueueList
        items={[
          reviewItem({
            capability: InboxSourceCapability.READ_ONLY_FORMER_OWNER,
            accountName: null,
            categoryName: null,
            note: "Shared card",
            displayTitle: "Shared card",
          }),
        ]}
        locale="en"
      />,
    );

    expect(screen.getByText("Shared card")).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(enInbox.ownerUnavailableHint)),
    ).toBeInTheDocument();
  });

  it("does not treat unread as a badge and still exposes read state to assistive tech", () => {
    renderInbox(
      <InboxQueueList
        items={[
          reviewItem({
            id: "550e8400-e29b-41d4-a716-446655440020",
            readAt: "2026-09-01T12:00:00Z",
          }),
        ]}
        locale="en"
      />,
    );

    expect(
      screen.queryByTestId(REVIEW_CARD_TEST_ID.UNREAD),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId(
        "inbox-item-link-550e8400-e29b-41d4-a716-446655440020",
      ),
    ).toHaveAttribute("aria-label", expect.stringContaining(enInbox.readLabel));
  });

  it("preserves Vietnamese kind copy without raw keys", () => {
    renderInbox(<InboxQueueList items={[reviewItem()]} locale="vi" />, "vi");

    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByTestId(REVIEW_CARD_TEST_ID.KIND)).toHaveTextContent(
      viInbox.kinds.unmapped_expense,
    );
    expect(
      screen.queryByText("kinds.unmapped_expense"),
    ).not.toBeInTheDocument();
  });

  it("keeps archived status as compact metadata without a competing badge", () => {
    renderInbox(
      <InboxQueueList
        items={[
          reviewItem({
            status: InboxItemStatus.RESOLVED,
            readAt: "2026-09-01T12:00:00Z",
          }),
        ]}
        locale="en"
        readOnly
      />,
    );

    expect(screen.getByTestId(REVIEW_CARD_TEST_ID.KIND)).toHaveTextContent(
      enInbox.statuses.resolved,
    );
    expect(
      screen.queryByTestId(REVIEW_CARD_TEST_ID.UNREAD),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("mirrors summary, tabs, filters, groups, and compact rows in the route skeleton", () => {
    const { container } = render(
      <>
        <InboxQueueSummarySkeleton />
        <InboxQueueTabsSkeleton />
        <InboxQueueListSkeleton />
      </>,
    );

    const summary = screen.getByTestId(INBOX_TEST_ID.LOADING_SUMMARY);
    const tabs = screen.getByTestId(INBOX_TEST_ID.LOADING_TABS);
    const filters = screen.getByTestId(INBOX_TEST_ID.LOADING_FILTERS);
    const groups = screen.getAllByTestId(INBOX_TEST_ID.LOADING_GROUP);
    const rows = screen.getAllByTestId(INBOX_TEST_ID.LOADING_ROW);

    expect(groups).toHaveLength(2);
    expect(rows).toHaveLength(5);
    expect(container.innerHTML.indexOf(summary.outerHTML)).toBeLessThan(
      container.innerHTML.indexOf(tabs.outerHTML),
    );
    expect(container.innerHTML.indexOf(tabs.outerHTML)).toBeLessThan(
      container.innerHTML.indexOf(filters.outerHTML),
    );
    expect(container.innerHTML.indexOf(filters.outerHTML)).toBeLessThan(
      container.innerHTML.indexOf(groups[0].outerHTML),
    );
    expect(rows[0]).toHaveClass("min-h-14");
  });

  it("keeps the loading route composition aligned with the loaded queue", () => {
    const page = readProjectFile("app/[locale]/(product)/inbox/page.tsx");
    const loading = readProjectFile("app/[locale]/(product)/inbox/loading.tsx");

    expect(page).toContain('variant="primary"');
    expect(loading).toContain('variant="primary"');
    expect(loading).toContain("InboxQueueSummarySkeleton");
    expect(loading).toContain("InboxQueueTabsSkeleton");
    expect(loading).toContain("InboxQueueListSkeleton");
    expect(page.indexOf("<InboxSummary")).toBeLessThan(
      page.indexOf("<InboxQueueTabs"),
    );
    expect(page.indexOf("<InboxQueueTabs")).toBeLessThan(
      page.indexOf("<InboxQueueList"),
    );
    expect(loading).toMatch(
      /<InboxQueueSummarySkeleton \/>\s*<InboxQueueTabsSkeleton \/>\s*<InboxQueueListSkeleton \/>/,
    );
  });

  it("preserves empty and unavailable recovery semantics", () => {
    renderInbox(
      <EmptyState
        title={enInbox.emptyOpenTitle}
        description={enInbox.emptyOpenBody}
      />,
    );
    expect(screen.getByText(enInbox.emptyOpenTitle)).toBeInTheDocument();
    expect(screen.getByText(enInbox.emptyOpenBody)).toBeInTheDocument();

    renderInbox(
      <InboxUnavailable
        title={enInbox.loadErrorTitle}
        description={enInbox.loadErrorBody}
        actionHref={APP_PATH.INBOX}
        actionLabel={enInbox.retry}
        testId="inbox-retry"
      />,
    );
    const retry = screen.getByTestId("inbox-retry");
    expect(retry.tagName).toBe("A");
    expect(retry).toHaveAttribute("href", APP_PATH.INBOX);
  });

  it("compacts supporting metadata without dropping ownership or lifecycle context", () => {
    expect(inboxOwnershipHintKey(InboxSourceCapability.ACTIONABLE)).toBeNull();
    expect(
      inboxOwnershipHintKey(InboxSourceCapability.READ_ONLY_NON_OWNER),
    ).toBe("ownerRequiredHint");
    expect(
      inboxQueueRowSubtitle({
        lifecycleLabel: "Due: 1 Jan 2026",
        ownershipHint: "Owner action required · read-only",
        detailParts: ["Cash"],
      }),
    ).toBe("Due: 1 Jan 2026 · Cash");
    expect(
      inboxQueueRowSubtitle({
        lifecycleLabel: null,
        ownershipHint: "Owner action required · read-only",
        detailParts: ["Cash"],
      }),
    ).toBe("Cash · Owner action required · read-only");
    expect(
      inboxQueueRowSubtitle({
        lifecycleLabel: null,
        ownershipHint: null,
        detailParts: [],
      }),
    ).toBeNull();
    expect(
      inboxQueueLifecycleLabel({
        context: InboxLifecycleContext.MATURITY,
        label: "Maturity: Oct 8, 2026",
      }),
    ).toBeNull();
    expect(
      inboxQueueLifecycleLabel({
        context: InboxLifecycleContext.DUE,
        label: "Due: 1 Jan 2026",
      }),
    ).toBe("Due: 1 Jan 2026");
    expect(
      inboxQueueLifecycleLabel({
        context: InboxLifecycleContext.EXPIRES,
        label: "Expires: 1 Jan 2026",
      }),
    ).toBe("Expires: 1 Jan 2026");
    expect(
      inboxQueueRowSubtitle({
        lifecycleLabel: inboxQueueLifecycleLabel({
          context: InboxLifecycleContext.MATURITY,
          label: "Maturity: Oct 8, 2026",
        }),
        ownershipHint: null,
        detailParts: ["Settlement cash"],
      }),
    ).toBe("Settlement cash");
    expect(
      inboxQueueDominantTitle({
        kind: InboxItemKind.SAVINGS_MATURITY,
        displayTitle: "Tikop 3 tháng vợ — Matures in 30 days",
      }),
    ).toEqual({
      title: "Matures in 30 days",
      context: "Tikop 3 tháng vợ",
    });
    expect(
      inboxQueueDominantTitle({
        kind: InboxItemKind.SAVINGS_MATURITY,
        displayTitle: "Matures in 30 days",
      }),
    ).toEqual({
      title: "Matures in 30 days",
      context: null,
    });
    expect(
      inboxQueueDominantTitle({
        kind: InboxItemKind.UNMAPPED_EXPENSE,
        displayTitle: "Lunch — leftover",
      }),
    ).toEqual({
      title: "Lunch — leftover",
      context: null,
    });
  });

  it("keeps the savings-maturity countdown once and omits the duplicate date", () => {
    const maturityTitle = "Matures in 30 days";
    renderInbox(
      <InboxQueueList
        items={[
          reviewItem({
            id: "550e8400-e29b-41d4-a716-446655440030",
            kind: InboxItemKind.SAVINGS_MATURITY,
            title: maturityTitle,
            displayTitle: maturityTitle,
            note: null,
            categoryName: null,
            accountName: "Settlement cash",
            lifecycleDate: "2026-10-08",
            lifecycleContext: InboxLifecycleContext.MATURITY,
          }),
        ]}
        locale="en"
      />,
    );

    const row = screen.getByTestId(
      "inbox-item-550e8400-e29b-41d4-a716-446655440030",
    );
    expect(row).toHaveTextContent(maturityTitle);
    expect(screen.getByTestId(REVIEW_CARD_TEST_ID.KIND)).toHaveTextContent(
      enInbox.kinds.savings_maturity,
    );
    expect(row).toHaveTextContent("Settlement cash");
    expect(screen.getByTestId(REVIEW_CARD_TEST_ID.UNREAD)).toBeInTheDocument();
    expect(row).not.toHaveTextContent(`${enInbox.lifecycleMaturity}:`);
    expect(row).not.toHaveTextContent("Oct 8, 2026");
    expect(screen.getByTestId(INBOX_TEST_ID.AMOUNT)).toHaveTextContent(
      "₫45,000",
    );
  });

  it("keeps the savings-maturity product as compact context, not a second title line", () => {
    renderInbox(
      <InboxQueueList
        items={[
          reviewItem({
            id: "550e8400-e29b-41d4-a716-446655440034",
            kind: InboxItemKind.SAVINGS_MATURITY,
            title: "Tikop 3 tháng vợ — Matures in 30 days",
            displayTitle: "Tikop 3 tháng vợ — Matures in 30 days",
            note: null,
            categoryName: null,
            accountName: null,
            lifecycleDate: "2026-10-08",
            lifecycleContext: InboxLifecycleContext.MATURITY,
          }),
        ]}
        locale="en"
      />,
    );

    const row = screen.getByTestId(
      "inbox-item-550e8400-e29b-41d4-a716-446655440034",
    );
    expect(row).toHaveTextContent("Matures in 30 days");
    expect(row).toHaveTextContent("Tikop 3 tháng vợ");
    expect(row).not.toHaveTextContent("Tikop 3 tháng vợ — Matures in 30 days");
    expect(screen.getByTestId(REVIEW_CARD_TEST_ID.KIND)).toHaveTextContent(
      enInbox.kinds.savings_maturity,
    );
    expect(screen.getByTestId(REVIEW_CARD_TEST_ID.UNREAD)).toBeInTheDocument();
    expect(row).not.toHaveTextContent(`${enInbox.lifecycleMaturity}:`);
    expect(
      screen.getByTestId(
        "inbox-item-link-550e8400-e29b-41d4-a716-446655440034",
      ),
    ).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Tikop 3 tháng vợ — Matures in 30 days"),
    );
  });

  it("keeps ownership context on the savings-maturity row without restoring the date", () => {
    renderInbox(
      <InboxQueueList
        items={[
          reviewItem({
            id: "550e8400-e29b-41d4-a716-446655440031",
            kind: InboxItemKind.SAVINGS_MATURITY,
            title: "Matures in 30 days",
            displayTitle: "Matures in 30 days",
            note: null,
            categoryName: null,
            accountName: null,
            capability: InboxSourceCapability.READ_ONLY_NON_OWNER,
            lifecycleDate: "2026-10-08",
            lifecycleContext: InboxLifecycleContext.MATURITY,
          }),
        ]}
        locale="en"
      />,
    );

    expect(
      screen.getByText(new RegExp(enInbox.ownerRequiredHint)),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("inbox-item-550e8400-e29b-41d4-a716-446655440031"),
    ).not.toHaveTextContent(`${enInbox.lifecycleMaturity}:`);
  });

  it("keeps Vietnamese savings-maturity kind copy without duplicating the date", () => {
    renderInbox(
      <InboxQueueList
        items={[
          reviewItem({
            id: "550e8400-e29b-41d4-a716-446655440032",
            kind: InboxItemKind.SAVINGS_MATURITY,
            title: "Matures in 30 days",
            displayTitle: "Matures in 30 days",
            note: null,
            categoryName: null,
            accountName: null,
            lifecycleDate: "2026-10-08",
            lifecycleContext: InboxLifecycleContext.MATURITY,
          }),
        ]}
        locale="vi"
      />,
      "vi",
    );

    const row = screen.getByTestId(
      "inbox-item-550e8400-e29b-41d4-a716-446655440032",
    );
    expect(row).toHaveTextContent("Matures in 30 days");
    expect(screen.getByTestId(REVIEW_CARD_TEST_ID.KIND)).toHaveTextContent(
      viInbox.kinds.savings_maturity,
    );
    expect(row).not.toHaveTextContent(`${viInbox.lifecycleMaturity}:`);
  });

  it("keeps independent due-date context on non-maturity rows", () => {
    renderInbox(
      <InboxQueueList
        items={[
          reviewItem({
            id: "550e8400-e29b-41d4-a716-446655440033",
            kind: InboxItemKind.LOAN_PAYMENT_ATTENTION,
            title: "Home loan installment",
            displayTitle: "Home loan installment",
            note: null,
            categoryName: null,
            accountName: null,
            lifecycleDate: "2026-01-01",
            lifecycleContext: InboxLifecycleContext.DUE,
          }),
        ]}
        locale="en"
      />,
    );

    const row = screen.getByTestId(
      "inbox-item-550e8400-e29b-41d4-a716-446655440033",
    );
    expect(row).toHaveTextContent("Home loan installment");
    expect(row).toHaveTextContent(`${enInbox.lifecycleDue}:`);
    expect(screen.getByTestId(REVIEW_CARD_TEST_ID.KIND)).toHaveTextContent(
      enInbox.kinds.loan_payment_attention,
    );
  });

  it("does not change Inbox queue tabs, filters, or grouping chrome", () => {
    renderInbox(<InboxQueueList items={[reviewItem()]} locale="en" />);

    expect(screen.getByTestId("inbox-kind-filter")).toBeInTheDocument();
    expect(screen.getByTestId("inbox-search")).toBeInTheDocument();
    expect(screen.getByTestId("inbox-filter-all")).toBeInTheDocument();
    expect(screen.getByText(enInbox.pendingSectionTitle)).toBeInTheDocument();
    expect(
      screen.getByTestId(inboxGroupTestId(InboxItemKind.UNMAPPED_EXPENSE)),
    ).toBeInTheDocument();
    expect(screen.getByTestId("inbox-partner-note")).toHaveTextContent(
      enInbox.partnerEqualNote,
    );
  });
});
