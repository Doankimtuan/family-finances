import type { ComponentProps, ReactElement } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enInbox from "@/messages/en/inbox.json";
import viInbox from "@/messages/vi/inbox.json";
import enCatalog from "@/messages/en/catalog.json";
import viCatalog from "@/messages/vi/catalog.json";
import { InboxQueueList } from "@/app/[locale]/(product)/inbox/inbox-queue-list";
import { InboxQueueTabs } from "@/app/[locale]/(product)/inbox/inbox-queue-tabs";
import {
  InboxQueueBodyPending,
  InboxQueueTransition,
} from "@/app/[locale]/(product)/inbox/inbox-queue-transition";
import {
  InboxDetailContext,
  InboxDetailSource,
} from "@/app/[locale]/(product)/inbox/inbox-detail-context";
import { InboxFinancialAmount } from "@/app/[locale]/(product)/inbox/inbox-financial-amount";
import {
  groupInboxItemsByKind,
  inboxAmountKind,
  inboxAmountLabel,
  isInboxFilterActive,
} from "@/app/[locale]/(product)/inbox/inbox-presentations";
import { resolveInboxSourceTarget } from "@/app/[locale]/(product)/inbox/inbox-source-link";
import {
  InboxEnrichmentState,
  InboxItemKind,
  InboxItemStatus,
  InboxKindFilter,
  InboxQueueHeaderState,
  InboxQueueTab,
  InboxSourceType,
  INBOX_TEST_ID,
  inboxFilterTestId,
  inboxGroupTestId,
} from "@/modules/inbox/application/inbox-constants";
import { InboxSourceCapability } from "@/modules/inbox/application/inbox-source-capabilities";
import type { InboxReviewItem } from "@/modules/inbox/application/inbox-types";
import { DEFAULT_CURRENCY } from "@/modules/ledger/application/ledger-constants";
import {
  inboxItemPath,
  inboxQueuePath,
  moneyTransactionPath,
} from "@/modules/tenancy/application/app-path";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import {
  FINANCIAL_PRIVACY_MASK,
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";
import { FinancialNumberKind } from "@/shared/patterns/financial-number-kind";
import { StatusBadgeTone } from "@/shared/ui/status-badge";
import { InboxSummary } from "@/app/[locale]/(product)/inbox/inbox-summary";
import { EmptyState } from "@/shared/patterns/empty-state";

const { pushMock, prefetchMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  prefetchMock: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    prefetch: prefetchMock,
    replace: vi.fn(),
  }),
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/[locale]/(product)/inbox/actions", () => ({
  loadMoreInboxAction: vi.fn(async () => null),
  resolveInboxAction: vi.fn(async () => ({ status: "success" })),
  dismissInboxAction: vi.fn(async () => ({ status: "success" })),
  acknowledgeInboxAction: vi.fn(async () => ({ status: "success" })),
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

afterEach(() => {
  window.localStorage.removeItem(FINANCIAL_PRIVACY_STORAGE_KEY);
  pushMock.mockClear();
  prefetchMock.mockClear();
});

describe("Phase 12 Inbox attention center", () => {
  it("maps existing Inbox amounts to financial-number kinds without a new score", () => {
    expect(inboxAmountKind(InboxItemKind.UNMAPPED_EXPENSE)).toBe(
      FinancialNumberKind.MOVEMENT,
    );
    expect(inboxAmountKind(InboxItemKind.INCOME_SUGGEST)).toBe(
      FinancialNumberKind.MOVEMENT,
    );
    expect(inboxAmountKind(InboxItemKind.SAVINGS_MATURITY)).toBe(
      FinancialNumberKind.CURRENT_STATE,
    );
    expect(inboxAmountKind(InboxItemKind.EARLY_WITHDRAWAL_CONFIRMATION)).toBe(
      FinancialNumberKind.CURRENT_STATE,
    );
    expect(inboxAmountKind(InboxItemKind.EMI_COMPLETE)).toBe(
      FinancialNumberKind.CURRENT_STATE,
    );
    expect(inboxAmountKind(InboxItemKind.EMERGENCY_DECLARATION)).toBe(
      FinancialNumberKind.INTENTION,
    );
    expect(inboxAmountKind(InboxItemKind.LOAN_PAYMENT_ATTENTION)).toBe(
      FinancialNumberKind.CURRENT_STATE,
    );
    expect(inboxAmountKind(InboxItemKind.DEBT_PAYMENT_ATTENTION)).toBe(
      FinancialNumberKind.CURRENT_STATE,
    );
    expect(inboxAmountKind(null)).toBe(FinancialNumberKind.CURRENT_STATE);
  });

  it("does not coerce missing or non-finite amounts to zero", () => {
    expect(inboxAmountLabel(null, DEFAULT_CURRENCY, "en")).toBeNull();
    expect(inboxAmountLabel(undefined, DEFAULT_CURRENCY, "en")).toBeNull();
    expect(inboxAmountLabel(Number.NaN, DEFAULT_CURRENCY, "en")).toBeNull();
    expect(inboxAmountLabel(45_000, null, "en")).toBeNull();
    expect(inboxAmountLabel(0, DEFAULT_CURRENCY, "en")).toContain("0");
  });

  it("groups by existing kind in first-seen order without inventing rank", () => {
    const expenseLater = reviewItem({
      id: "550e8400-e29b-41d4-a716-446655440012",
      displayTitle: "Coffee",
      note: "Coffee",
    });
    const maturity = reviewItem({
      id: "550e8400-e29b-41d4-a716-446655440013",
      kind: InboxItemKind.SAVINGS_MATURITY,
      displayTitle: "Matures in 30 days",
      note: null,
      categoryName: null,
    });
    const groups = groupInboxItemsByKind([
      reviewItem(),
      maturity,
      expenseLater,
    ]);

    expect(groups.map((group) => group.kind)).toEqual([
      InboxItemKind.UNMAPPED_EXPENSE,
      InboxItemKind.SAVINGS_MATURITY,
    ]);
    expect(groups[0]?.items.map((item) => item.id)).toEqual([
      reviewItem().id,
      expenseLater.id,
    ]);
  });

  it("renders a summary-first open queue with kind groups and 44px filters", () => {
    const maturity = reviewItem({
      id: "550e8400-e29b-41d4-a716-446655440013",
      kind: InboxItemKind.SAVINGS_MATURITY,
      displayTitle: "Matures in 30 days",
      note: null,
      categoryName: null,
      accountName: null,
    });
    renderInbox(
      <InboxQueueList items={[reviewItem(), maturity]} locale="en" />,
    );

    expect(screen.getByText(enInbox.pendingSectionTitle)).toBeInTheDocument();
    expect(
      screen.getByTestId(inboxGroupTestId(InboxItemKind.UNMAPPED_EXPENSE)),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(inboxGroupTestId(InboxItemKind.SAVINGS_MATURITY)),
    ).toBeInTheDocument();
    const amounts = screen.getAllByTestId(INBOX_TEST_ID.AMOUNT);
    expect(amounts).toHaveLength(2);
    expect(amounts[0]?.parentElement).toHaveAttribute(
      "data-financial-kind",
      FinancialNumberKind.MOVEMENT,
    );
    expect(amounts[1]?.parentElement).toHaveAttribute(
      "data-financial-kind",
      FinancialNumberKind.CURRENT_STATE,
    );
    expect(screen.getByTestId(INBOX_TEST_ID.SEARCH)).toHaveClass("min-h-11");
    expect(
      screen.getByTestId(inboxFilterTestId(InboxKindFilter.ALL)),
    ).toHaveClass("min-h-11");
    expect(
      screen.getByTestId(`inbox-item-link-${reviewItem().id}`),
    ).toHaveAttribute("href", inboxItemPath(reviewItem().id));
  });

  it("shows a filtered-empty state with a clear action, not a global empty", () => {
    renderInbox(<InboxQueueList items={[reviewItem()]} locale="en" />);

    fireEvent.click(
      screen.getByTestId(inboxFilterTestId(InboxItemKind.SAVINGS_MATURITY)),
    );

    expect(screen.getByText(enInbox.filterEmptyTitle)).toBeInTheDocument();
    expect(screen.getByText(enInbox.filterEmptyBody)).toBeInTheDocument();
    expect(screen.queryByText(enInbox.emptyOpenTitle)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId(INBOX_TEST_ID.FILTER_CLEAR));

    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(isInboxFilterActive(InboxKindFilter.ALL, "")).toBe(false);
  });

  it("keeps Vietnamese filter-empty copy without implying a globally empty Inbox", () => {
    renderInbox(<InboxQueueList items={[reviewItem()]} locale="vi" />, "vi");
    fireEvent.click(
      screen.getByTestId(inboxFilterTestId(InboxItemKind.SAVINGS_MATURITY)),
    );
    expect(screen.getByText(viInbox.filterEmptyTitle)).toBeInTheDocument();
    expect(screen.getByText(viInbox.filterClear)).toBeInTheDocument();
  });

  it("omits a missing queue amount instead of showing zero", () => {
    renderInbox(
      <InboxQueueList
        items={[reviewItem({ amount: Number.NaN })]}
        locale="en"
      />,
    );

    expect(screen.queryByTestId(INBOX_TEST_ID.AMOUNT)).not.toBeInTheDocument();
    expect(screen.queryByText("₫0")).not.toBeInTheDocument();
    expect(screen.getByText("Lunch")).toBeInTheDocument();
  });

  it("masks amounts without leaking them through the row aria-label", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );

    renderInbox(<InboxQueueList items={[reviewItem()]} locale="en" />);

    expect(screen.getByText(FINANCIAL_PRIVACY_MASK)).toBeInTheDocument();
    expect(screen.queryByText("₫45,000")).not.toBeInTheDocument();
    expect(
      screen.getByTestId(`inbox-item-link-${reviewItem().id}`),
    ).toHaveAttribute("aria-label", expect.not.stringMatching(/45|₫/));
  });

  it("exposes Open/Archived as accessible tabs with keyboard movement", () => {
    renderInbox(
      <InboxQueueTransition tab={InboxQueueTab.OPEN}>
        <InboxQueueTabs />
        <InboxQueueBodyPending>
          <p>Open queue</p>
        </InboxQueueBodyPending>
      </InboxQueueTransition>,
    );

    const tablist = screen.getByRole("tablist", {
      name: enInbox.tabListLabel,
    });
    const open = screen.getByTestId(INBOX_TEST_ID.TAB_OPEN);
    const archived = screen.getByTestId(INBOX_TEST_ID.TAB_ARCHIVED);

    expect(open).toHaveAttribute("aria-selected", "true");
    expect(open).toHaveAttribute("aria-controls", INBOX_TEST_ID.TAB_CONTENT);
    expect(open).toHaveClass("min-h-11");
    expect(open).toHaveClass("font-semibold");
    expect(archived).toHaveAttribute("aria-selected", "false");
    expect(archived).toHaveClass("font-medium");
    expect(screen.getByTestId(INBOX_TEST_ID.TAB_CONTENT)).toHaveAttribute(
      "role",
      "tabpanel",
    );

    fireEvent.keyDown(tablist, { key: "ArrowRight" });

    expect(archived).toHaveAttribute("aria-selected", "true");
    expect(open).toHaveAttribute("aria-selected", "false");
    expect(pushMock).toHaveBeenCalledWith(
      inboxQueuePath(InboxQueueTab.ARCHIVED),
    );
  });

  it("keeps the detail hierarchy of identity, decision context, and source", () => {
    renderInbox(
      <>
        <InboxSummary
          state={InboxQueueHeaderState.OPEN}
          headline={enInbox.header.headline.open.replace(
            "{count, plural, one {1 item to review} other {# items to review}}",
            "3 items to review",
          )}
          supporting={enInbox.header.supporting.open}
          facts={[{ label: enInbox.facts.waiting, value: "3 items to review" }]}
        />
        <InboxDetailContext
          pending
          heading={enInbox.decisionQuestionHeading}
          question={enInbox.why.unmapped_expense}
          statusLabel={enInbox.statuses.pending}
          partnerNote={enInbox.partnerEqualNote}
          lifecycleLabel={null}
        />
        <InboxDetailSource
          title="Lunch"
          kindLabel={enInbox.kinds.unmapped_expense}
          amountLabel={
            <InboxFinancialAmount
              amountLabel="₫45,000"
              kind={FinancialNumberKind.MOVEMENT}
            />
          }
          statusTone={StatusBadgeTone.WARNING}
        />
      </>,
    );

    expect(screen.getByTestId("inbox-summary")).toHaveTextContent(
      "3 items to review",
    );
    expect(
      screen.getByTestId(INBOX_TEST_ID.DECISION_QUESTION),
    ).toHaveTextContent(enInbox.why.unmapped_expense);
    expect(screen.getByTestId(INBOX_TEST_ID.DETAIL_CARD)).toHaveTextContent(
      "Lunch",
    );
    expect(
      screen.getByTestId(INBOX_TEST_ID.AMOUNT).parentElement,
    ).toHaveAttribute("data-financial-kind", FinancialNumberKind.MOVEMENT);
  });

  it("preserves canonical source links and existing mutation payloads", () => {
    const item = reviewItem();
    expect(resolveInboxSourceTarget(item)).toEqual({
      href: moneyTransactionPath(item.sourceId),
      labelKey: "viewSourceTransaction",
    });

    const actions = readProjectFile("app/[locale]/(product)/inbox/actions.ts");
    const panel = readProjectFile(
      "app/[locale]/(product)/inbox/inbox-decision-panel.tsx",
    );
    const detail = readProjectFile(
      "app/[locale]/(product)/inbox/[id]/page.tsx",
    );
    const queue = readProjectFile("app/[locale]/(product)/inbox/page.tsx");

    expect(actions).toContain("resolveInboxItemToJar(input)");
    expect(actions).toContain("dismissInboxItem(input)");
    expect(actions).toContain("acknowledgeInboxItem(input)");
    expect(panel).toContain(
      "resolveInboxAction({ inboxItemId: item.id, jarId })",
    );
    expect(panel).toContain("dismissInboxAction({ inboxItemId: item.id })");
    expect(panel).toContain(
      "acknowledgeInboxAction({ inboxItemId: item.id, action })",
    );
    expect(detail).toContain("inboxAmountKind(item.kind)");
    expect(detail).toContain("<InboxSourceLink item={item} />");
    expect(detail).toContain(
      "<InboxDecisionPanel item={item} jars={activeJars} />",
    );
    expect(queue).toContain("listOpenInboxPage");
    expect(queue).toContain("listArchivedInboxItems");
    expect(queue).toContain("APP_PATH.INBOX");
    expect(queue).not.toContain("Net Worth");
    expect(queue).not.toContain("attention score");
  });

  it("keeps global empty copy distinct from filtered empty", () => {
    renderInbox(
      <EmptyState
        title={enInbox.emptyOpenTitle}
        description={enInbox.emptyOpenBody}
      />,
    );
    expect(screen.getByText(enInbox.emptyOpenTitle)).toBeInTheDocument();
    expect(
      screen.queryByText(enInbox.filterEmptyTitle),
    ).not.toBeInTheDocument();
  });
});
