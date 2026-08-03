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
      <p className="text-sm leading-relaxed text-text-secondary">
        {hasPending
          ? t("inbox.pending", { count: openCount })
          : t("inbox.clear")}
      </p>
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
