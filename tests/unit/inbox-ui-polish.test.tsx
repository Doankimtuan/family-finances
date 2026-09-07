import type { ComponentProps, ReactElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextIntlClientProvider } from "next-intl";
import enInbox from "@/messages/en/inbox.json";
import { InboxSummary } from "@/app/[locale]/(product)/inbox/inbox-summary";
import {
  InboxFactRow,
  InboxFactsCard,
} from "@/app/[locale]/(product)/inbox/inbox-facts";
import { InboxSectionTitle } from "@/app/[locale]/(product)/inbox/inbox-section-title";
import { InboxUnavailable } from "@/app/[locale]/(product)/inbox/inbox-unavailable";
import { InboxQueueTabs } from "@/app/[locale]/(product)/inbox/inbox-queue-tabs";
import {
  InboxQueueBodyPending,
  InboxQueueTransition,
} from "@/app/[locale]/(product)/inbox/inbox-queue-transition";
import {
  inboxDisplayTitle,
  inboxItemVisual,
  inboxLifecycleLabelKey,
} from "@/app/[locale]/(product)/inbox/inbox-presentations";
import { ReviewCard, ReviewCardDensity } from "@/shared/patterns/review-card";
import {
  InboxItemKind,
  InboxLifecycleContext,
  InboxQueueHeaderState,
  InboxQueueTab,
  INBOX_TAB_QUERY,
  INBOX_TEST_ID,
} from "@/modules/inbox/application/inbox-constants";
import {
  APP_PATH,
  inboxQueuePath,
} from "@/modules/tenancy/application/app-path";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { IconContainerTone } from "@/shared/ui/icon-container";
import { StatusBadgeTone } from "@/shared/ui/status-badge";

const { pushMock, prefetchMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  prefetchMock: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock, prefetch: prefetchMock }),
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

function renderInbox(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ inbox: enInbox }}>
      <FinancialPrivacyProvider>{ui}</FinancialPrivacyProvider>
    </NextIntlClientProvider>,
  );
}

describe("Inbox UI polish", () => {
  it("keeps the privacy control on the summary and lists real facts", () => {
    renderInbox(
      <InboxSummary
        state={InboxQueueHeaderState.OPEN}
        headline="A few things are ready for you"
        supporting="A quick look now can keep the household moving."
        facts={[{ label: "Waiting", value: "2 items to review" }]}
      />,
    );

    expect(screen.getByTestId("inbox-summary")).toBeInTheDocument();
    expect(
      screen.getByText("A few things are ready for you"),
    ).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(screen.getByText("2 items to review")).toBeInTheDocument();
    expect(
      screen.getByTestId("inbox-financial-privacy-toggle"),
    ).toBeInTheDocument();
  });

  it("renders review rows with a trailing chevron and no card chrome", () => {
    renderInbox(
      <ReviewCard
        density={ReviewCardDensity.ROW}
        showChevron
        unread
        title="Lunch"
        kindLabel="Unmapped expense"
        amountLabel="₫45,000"
        actionLabel="Open to decide"
        data-testid="inbox-row"
      />,
    );

    const row = screen.getByTestId("inbox-row");
    expect(row).toHaveClass("hover:bg-surface-hover");
    expect(row).not.toHaveClass("shadow-[var(--elevation-1)]");
    expect(screen.getByText("Lunch")).toBeInTheDocument();
    expect(screen.getByText("₫45,000")).toBeInTheDocument();
    expect(row.querySelector("svg")).not.toBeNull();
  });

  it("renders source facts as label and value rows", () => {
    renderInbox(
      <InboxFactsCard title="Transaction details" testId="inbox-facts">
        <InboxFactRow label="Category" value="Food" />
      </InboxFactsCard>,
    );

    expect(screen.getByText("Transaction details")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByTestId("inbox-facts")).toBeInTheDocument();
  });

  it("keeps recovery as a link without inventing extra copy", () => {
    renderInbox(
      <InboxUnavailable
        title="Could not load Inbox"
        description="Check your connection and try again."
        actionHref={APP_PATH.INBOX}
        actionLabel="Try again"
        testId="inbox-retry"
      />,
    );

    const action = screen.getByTestId("inbox-retry");
    expect(action.tagName).toBe("A");
    expect(action).toHaveAttribute("href", APP_PATH.INBOX);
    expect(action).toHaveTextContent("Try again");
  });

  it("maps kind visuals and lifecycle labels from domain constants", () => {
    expect(inboxItemVisual(InboxItemKind.UNMAPPED_EXPENSE)).toMatchObject({
      tone: IconContainerTone.EXPENSE,
      statusTone: StatusBadgeTone.WARNING,
    });
    expect(inboxLifecycleLabelKey(InboxLifecycleContext.DUE)).toBe(
      "lifecycleDue",
    );
    expect(inboxLifecycleLabelKey(null)).toBeNull();
    expect(
      inboxDisplayTitle({
        note: "Lunch",
        localizedCategory: "Food",
        displayTitle: "Unmapped expense",
        kindLabel: "Unmapped expense",
      }),
    ).toBe("Lunch");
  });

  it("renders a quiet section title", () => {
    renderInbox(<InboxSectionTitle>Needs your attention</InboxSectionTitle>);
    expect(screen.getByText("Needs your attention")).toHaveAttribute(
      "data-slot",
      "section-title",
    );
  });

  it("selects the archived tab immediately while the queue fetch starts", () => {
    renderInbox(
      <InboxQueueTransition tab={InboxQueueTab.OPEN}>
        <InboxQueueTabs />
        <InboxQueueBodyPending>
          <p>Open queue</p>
        </InboxQueueBodyPending>
      </InboxQueueTransition>,
    );

    const archived = screen.getByTestId(INBOX_TEST_ID.TAB_ARCHIVED);
    expect(screen.getByTestId(INBOX_TEST_ID.TAB_OPEN)).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(archived);

    expect(archived).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId(INBOX_TEST_ID.TAB_OPEN)).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByTestId(INBOX_TEST_ID.TAB_LOADING)).toBeInTheDocument();
    expect(screen.queryByText("Open queue")).not.toBeInTheDocument();
    expect(pushMock).toHaveBeenCalledWith(
      inboxQueuePath(InboxQueueTab.ARCHIVED),
    );
    expect(prefetchMock).toHaveBeenCalledWith(
      inboxQueuePath(InboxQueueTab.ARCHIVED),
    );
  });

  it("builds the archived queue from the tab query constant", () => {
    expect(inboxQueuePath(InboxQueueTab.OPEN)).toBe(APP_PATH.INBOX);
    expect(inboxQueuePath(InboxQueueTab.ARCHIVED)).toEqual({
      pathname: APP_PATH.INBOX,
      query: { [INBOX_TAB_QUERY]: InboxQueueTab.ARCHIVED },
    });
  });
});
