import type { ComponentProps } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TransactionRow } from "@/shared/patterns/transaction-row";
import { FinancialPrivacyProvider } from "@/providers/financial-privacy-provider";
import { TransactionsFilterBar } from "@/app/[locale]/(product)/money/transactions/transactions-filter-bar";
import { TransactionsActivityList } from "@/app/[locale]/(product)/money/transactions/transactions-activity-list";
import {
  TRANSACTION_CATEGORY_QUERY_PARAM,
  TRANSACTION_JAR_QUERY_PARAM,
  TRANSACTION_TYPE_QUERY_PARAM,
  TransactionDirection,
  TransactionFilterType,
} from "@/modules/ledger/application/client";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import {
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";

const push = vi.fn();

afterEach(() => vi.unstubAllGlobals());

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ push }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

describe("Transactions scan-first presentation", () => {
  it("keeps amount sign visible and exposes movement text for assistive tech", () => {
    render(
      <TransactionRow
        title="Coffee shop"
        subtitle="Food · Cash"
        amountLabel="−₫85,000"
        amountMeta="Needs category"
        amountAriaLabel="Expense ₫85,000"
      />,
    );

    expect(screen.getByText("Coffee shop")).toBeInTheDocument();
    expect(screen.getByText("Food · Cash")).toBeInTheDocument();
    expect(screen.getByText("−₫85,000")).toBeInTheDocument();
    expect(screen.getByText("Needs category")).toBeInTheDocument();
    expect(screen.getByText("Expense ₫85,000")).toHaveClass("sr-only");
  });

  it("does not announce unmasked amounts when privacy is hidden", () => {
    window.localStorage.setItem(
      FINANCIAL_PRIVACY_STORAGE_KEY,
      FINANCIAL_PRIVACY_STORAGE_TRUE,
    );

    render(
      <FinancialPrivacyProvider>
        <TransactionRow
          title="Coffee shop"
          amountLabel="−₫85,000"
          amountAriaLabel="Expense ₫85,000"
        />
      </FinancialPrivacyProvider>,
    );

    expect(screen.getByText("Coffee shop")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("−₫85,000");
    expect(document.body).not.toHaveTextContent("Expense ₫85,000");
  });

  it("exposes selected filter chips and can clear through the list route", async () => {
    const filterOptionsPromise = Promise.resolve({ categories: [], jars: [] });
    const transactionTagsPromise = Promise.resolve([]);
    await act(async () => {
      render(
        <TransactionsFilterBar
          type={TransactionFilterType.EXPENSE}
          query=""
          categoryIds={[]}
          jarIds={[]}
          selectedTagIds={[]}
          filterOptionsPromise={filterOptionsPromise}
          transactionTagsPromise={transactionTagsPromise}
        />,
      );
      await Promise.all([filterOptionsPromise, transactionTagsPromise]);
    });

    expect(screen.getByTestId("transactions-filter-expense")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const clearFilters = screen.getByTestId("transactions-clear-filters");
    expect(clearFilters).toHaveTextContent("clearFilters");
    fireEvent.click(clearFilters);
    expect(push).toHaveBeenCalledWith(APP_PATH.MONEY_TRANSACTIONS);

    push.mockClear();
    fireEvent.click(screen.getByTestId("transactions-filter-income"));
    expect(push).toHaveBeenCalledWith(
      `${APP_PATH.MONEY_TRANSACTIONS}?${TRANSACTION_TYPE_QUERY_PARAM}=income`,
    );
  });

  it("applies multiple category and jar selections together", async () => {
    const filterOptionsPromise = Promise.resolve({
      categories: [
        {
          id: "category-one",
          kind: TransactionDirection.EXPENSE,
          name: "Groceries",
          jarId: null,
          isActive: true,
        },
        {
          id: "category-two",
          kind: TransactionDirection.EXPENSE,
          name: "Transport",
          jarId: null,
          isActive: false,
        },
      ],
      jars: [
        {
          id: "jar-one",
          kind: TransactionDirection.EXPENSE,
          name: "Essentials",
          isArchived: false,
          isPaused: false,
        },
        {
          id: "jar-two",
          kind: TransactionDirection.EXPENSE,
          name: "Travel",
          isArchived: true,
          isPaused: false,
        },
      ],
    });
    const transactionTagsPromise = Promise.resolve([]);
    await act(async () => {
      render(
        <TransactionsFilterBar
          type={TransactionFilterType.ALL}
          query=""
          categoryIds={[]}
          jarIds={[]}
          selectedTagIds={[]}
          filterOptionsPromise={filterOptionsPromise}
          transactionTagsPromise={transactionTagsPromise}
        />,
      );
      await Promise.all([filterOptionsPromise, transactionTagsPromise]);
    });

    fireEvent.click(screen.getByTestId("transactions-open-filters"));
    fireEvent.click(
      screen.getByTestId("transactions-category-option-category-one"),
    );
    fireEvent.click(
      screen.getByTestId("transactions-category-option-category-two"),
    );
    fireEvent.click(screen.getByTestId("transactions-jar-option-jar-one"));
    fireEvent.click(screen.getByTestId("transactions-jar-option-jar-two"));

    expect(
      screen.getByTestId("transactions-category-option-category-one"),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByTestId("transactions-jar-option-jar-two"),
    ).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByTestId("transactions-apply-filters"));
    expect(push).toHaveBeenCalledWith(
      `${APP_PATH.MONEY_TRANSACTIONS}?${TRANSACTION_CATEGORY_QUERY_PARAM}=category-one%2Ccategory-two&${TRANSACTION_JAR_QUERY_PARAM}=jar-one%2Cjar-two`,
    );
  });

  it("keeps active dynamic filters visible while reference options load", async () => {
    const pending = new Promise<null>(() => {});

    await act(async () => {
      render(
        <TransactionsFilterBar
          type={TransactionFilterType.ALL}
          query=""
          categoryIds={["selected-category"]}
          jarIds={[]}
          selectedTagIds={[]}
          filterOptionsPromise={pending}
          transactionTagsPromise={pending}
        />,
      );
      await Promise.resolve();
    });

    expect(screen.getByTestId("transactions-filter-all")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("transactions-open-filters")).toBeDisabled();
    expect(screen.getByTestId("transactions-open-filters")).toHaveTextContent(
      "1",
    );
    expect(screen.queryByText("noCategoriesMatch")).not.toBeInTheDocument();
  });

  it("offers a retry after a failed page request", async () => {
    class IntersectingObserver {
      constructor(private readonly callback: IntersectionObserverCallback) {}

      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }

      disconnect() {}
    }

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          activities: [],
          hasMore: false,
          nextCursor: null,
        }),
      });
    vi.stubGlobal(
      "IntersectionObserver",
      IntersectingObserver as unknown as typeof IntersectionObserver,
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TransactionsActivityList
        initialActivities={[]}
        initialNextCursor="cursor-1"
        initialHasMore
        type={TransactionFilterType.ALL}
        query=""
        categoryIds={[]}
        jarIds={[]}
        selectedTagIds={[]}
        listKey="transactions"
        emptyState={<p>No transactions found</p>}
      />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("loadMoreError");
    fireEvent.click(screen.getByRole("button", { name: "retry" }));

    expect(
      await screen.findByText("No transactions found"),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows a loading icon while the next page is pending", async () => {
    class IntersectingObserver {
      constructor(private readonly callback: IntersectionObserverCallback) {}

      observe(target: Element) {
        this.callback(
          [{ isIntersecting: true, target } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }

      disconnect() {}
    }

    type PageResponse = {
      ok: true;
      json: () => Promise<{
        activities: never[];
        hasMore: false;
        nextCursor: null;
      }>;
    };
    let resolvePage: (response: PageResponse) => void = () => undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<PageResponse>((resolve) => {
          resolvePage = resolve;
        }),
    );
    vi.stubGlobal(
      "IntersectionObserver",
      IntersectingObserver as unknown as typeof IntersectionObserver,
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TransactionsActivityList
        initialActivities={[]}
        initialNextCursor="cursor-1"
        initialHasMore
        type={TransactionFilterType.ALL}
        query=""
        categoryIds={[]}
        jarIds={[]}
        selectedTagIds={[]}
        listKey="transactions-loading-indicator"
        emptyState={<p>No transactions found</p>}
      />,
    );

    const loadingIndicator = await screen.findByTestId(
      "transactions-load-more-loading",
    );
    expect(loadingIndicator).toBeVisible();
    expect(loadingIndicator.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByTestId("transactions-activity-list")).toHaveAttribute(
      "aria-busy",
      "true",
    );

    resolvePage({
      ok: true,
      json: async () => ({ activities: [], hasMore: false, nextCursor: null }),
    });
    expect(
      await screen.findByText("No transactions found"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("transactions-load-more-loading"),
    ).not.toBeInTheDocument();
  });
});
