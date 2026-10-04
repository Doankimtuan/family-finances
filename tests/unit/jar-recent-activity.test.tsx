import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JarRecentActivity } from "@/app/[locale]/(product)/plan/jars/jar-recent-activity";
import { listTransactionEvents } from "@/modules/ledger/application";
import { TransactionFilterType } from "@/modules/ledger/application/ledger-constants";
import { PLAN_JAR_RECENT_ACTIVITY_LIMIT } from "@/modules/plan/application/plan-constants";
import { APP_LOCALE } from "@/i18n/routing";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/modules/ledger/application", () => ({
  listTransactionEvents: vi.fn(),
}));

const jarId = "11111111-1111-4111-8111-111111111111";

describe("Jar recent ledger activity", () => {
  it("scopes the read to the selected Jar and distinguishes unavailable data", async () => {
    vi.mocked(listTransactionEvents).mockResolvedValue(null);
    render(await JarRecentActivity({ jarId, locale: APP_LOCALE.ENGLISH }));
    expect(listTransactionEvents).toHaveBeenCalledWith({
      type: TransactionFilterType.ALL,
      jarIds: [jarId],
      limit: PLAN_JAR_RECENT_ACTIVITY_LIMIT,
    });
    expect(screen.getByText("recentActivityUnavailable")).toBeInTheDocument();
    expect(screen.queryByText("recentActivityEmpty")).not.toBeInTheDocument();
  });

  it("shows an empty state only after a successful empty read", async () => {
    vi.mocked(listTransactionEvents).mockResolvedValue({
      activities: [],
      hasMore: false,
      nextCursor: null,
    });
    render(await JarRecentActivity({ jarId, locale: APP_LOCALE.ENGLISH }));
    expect(screen.getByText("recentActivityEmpty")).toBeInTheDocument();
    expect(
      screen.queryByText("recentActivityUnavailable"),
    ).not.toBeInTheDocument();
  });
});
