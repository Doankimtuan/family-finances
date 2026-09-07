import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Skeleton } from "@/shared/ui/skeleton";
import { INBOX_TEST_ID } from "@/modules/inbox/application/inbox-constants";
import {
  InboxQueueListSkeleton,
  InboxQueueSummarySkeleton,
  InboxQueueTabsSkeleton,
} from "./inbox-queue-skeleton";

export default async function InboxLoading() {
  const t = await getTranslations("inbox");

  return (
    <Page
      testId={INBOX_TEST_ID.LOADING}
      topBar={
        <TopAppBar
          variant="primary"
          eyebrow={t("header.eyebrow")}
          title={t("title")}
          meta={<Skeleton className="h-4 w-20" />}
        />
      }
      contentClassName="gap-(--space-5)"
    >
      <InboxQueueSummarySkeleton />
      <InboxQueueTabsSkeleton />
      <InboxQueueListSkeleton />
    </Page>
  );
}
