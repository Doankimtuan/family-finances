import { getTranslations } from "next-intl/server";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  InboxQueueListSkeleton,
  InboxQueueSummarySkeleton,
} from "./inbox-queue-skeleton";

export default async function InboxLoading() {
  const t = await getTranslations("inbox");

  return (
    <Page
      topBar={
        <TopAppBar
          variant="contextual"
          eyebrow={t("header.eyebrow")}
          title={t("title")}
          meta={<Skeleton className="h-4 w-20" />}
        />
      }
      contentClassName="gap-(--space-5)"
    >
      <InboxQueueSummarySkeleton />

      <div className="flex gap-(--space-1) rounded-full bg-surface-muted p-(--space-1)">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 flex-1 rounded-full" />
      </div>

      <InboxQueueListSkeleton />
    </Page>
  );
}
