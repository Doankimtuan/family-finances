"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { inboxQueuePath } from "@/modules/tenancy/application/app-path";
import {
  InboxQueueTab,
  INBOX_TEST_ID,
} from "@/modules/inbox/application/inbox-constants";
import {
  InboxQueueListSkeleton,
  InboxQueueSummarySkeleton,
} from "./inbox-queue-skeleton";

type InboxQueueTransitionState = {
  isSwitching: boolean;
  optimisticTab: InboxQueueTab;
  selectTab: (tab: InboxQueueTab) => void;
};

const InboxQueueTransitionContext =
  createContext<InboxQueueTransitionState | null>(null);

export function InboxQueueTransition({
  tab,
  children,
}: {
  tab: InboxQueueTab;
  children: ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingTab, setPendingTab] = useState<InboxQueueTab | null>(null);
  const [seenTab, setSeenTab] = useState(tab);

  if (tab !== seenTab) {
    setSeenTab(tab);
    setPendingTab(null);
  }

  const optimisticTab = pendingTab ?? tab;
  const isSwitching = pendingTab != null && pendingTab !== tab;

  useEffect(() => {
    const alternateTab =
      tab === InboxQueueTab.OPEN ? InboxQueueTab.ARCHIVED : InboxQueueTab.OPEN;
    router.prefetch(inboxQueuePath(alternateTab));
  }, [tab, router]);

  const selectTab = (nextTab: InboxQueueTab) => {
    if (nextTab === optimisticTab || isSwitching) return;

    setPendingTab(nextTab);
    startTransition(() => {
      router.push(inboxQueuePath(nextTab));
    });
  };

  return (
    <InboxQueueTransitionContext.Provider
      value={{ isSwitching, optimisticTab, selectTab }}
    >
      {children}
    </InboxQueueTransitionContext.Provider>
  );
}

export function useInboxQueueTransition() {
  const state = useContext(InboxQueueTransitionContext);
  if (state == null) {
    throw new Error("Inbox queue tabs require an InboxQueueTransition parent.");
  }
  return state;
}

function InboxQueuePending({
  children,
  skeleton,
  announce = false,
}: {
  children: ReactNode;
  skeleton: ReactNode;
  announce?: boolean;
}) {
  const { isSwitching } = useInboxQueueTransition();
  const t = useTranslations("inbox");

  if (!isSwitching) {
    return children;
  }

  if (!announce) {
    return skeleton;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid={INBOX_TEST_ID.TAB_LOADING}
    >
      <span className="sr-only">{t("tabLoading")}</span>
      {skeleton}
    </div>
  );
}

/** Keeps the tab chrome mounted while summary and receipts refresh. */
export function InboxQueueHeaderPending({ children }: { children: ReactNode }) {
  return (
    <InboxQueuePending skeleton={<InboxQueueSummarySkeleton />}>
      {children}
    </InboxQueuePending>
  );
}

/** Keeps the tab chrome mounted while the queue list refreshes. */
export function InboxQueueBodyPending({ children }: { children: ReactNode }) {
  const { isSwitching, optimisticTab } = useInboxQueueTransition();
  const labelledBy =
    optimisticTab === InboxQueueTab.OPEN
      ? INBOX_TEST_ID.TAB_OPEN
      : INBOX_TEST_ID.TAB_ARCHIVED;

  return (
    <div
      role="tabpanel"
      id={INBOX_TEST_ID.TAB_CONTENT}
      aria-labelledby={labelledBy}
      aria-busy={isSwitching}
      data-testid={INBOX_TEST_ID.TAB_CONTENT}
    >
      <InboxQueuePending announce skeleton={<InboxQueueListSkeleton />}>
        {children}
      </InboxQueuePending>
    </div>
  );
}
