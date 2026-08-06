"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Button } from "@/shared/ui/button";

export function HomeInboxCta({ openCount }: { openCount: number }) {
  const t = useTranslations("home");
  const router = useRouter();
  const hasPending = openCount > 0;

  return (
    <div className="flex flex-col gap-(--space-3)" data-testid="home-inbox">
      <div className="flex items-center justify-between gap-(--space-3)">
        <p className="text-sm leading-relaxed text-text-secondary">
          {hasPending
            ? t("inbox.pending", { count: openCount })
            : t("inbox.clear")}
        </p>
        <span className="shrink-0 rounded-md border border-border-subtle bg-canvas px-(--space-2) py-(--space-1) text-sm font-semibold tabular-nums text-text-primary">
          {openCount}
        </span>
      </div>
      <Button
        variant={hasPending ? "primary" : "secondary"}
        className="min-h-11 w-full"
        data-testid="home-inbox-cta"
        onPress={() => router.push(APP_PATH.INBOX)}
      >
        {t("inbox.open")}
      </Button>
    </div>
  );
}
