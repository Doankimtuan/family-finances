"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { CaptureJarOption } from "@/modules/ledger/application";
import type { InboxReviewItem } from "@/modules/inbox/application";
import { formatCurrency } from "@/shared/i18n/formatters";
import { Button } from "@/shared/ui/button";
import { Text } from "@/shared/ui/text";
import { StatusAlert } from "@/shared/ui/status-alert";
import { useOnlineStatusClient } from "@/shared/hooks/use-online-status";
import { localizeCatalogName } from "@/shared/i18n/localize-catalog-name";
import { resolveInboxAction } from "./actions";

type Props = {
  item: InboxReviewItem;
  jars: CaptureJarOption[];
  locale: string;
};

export function InboxResolveRow({ item, jars, locale }: Props) {
  const t = useTranslations("inbox");
  const tCatalog = useTranslations("catalog");
  const router = useRouter();
  const { online } = useOnlineStatusClient();
  const [jarId, setJarId] = useState(jars[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onResolve = () => {
    setError(null);
    if (!online) {
      setError(t("errors.offline"));
      return;
    }
    if (!jarId) {
      setError(t("errors.invalid"));
      return;
    }
    startTransition(async () => {
      const result = await resolveInboxAction({
        inboxItemId: item.id,
        jarId,
      });
      if (result.status === "success") {
        router.refresh();
        return;
      }
      setError(t(`errors.${result.code}`));
    });
  };

  return (
    <li
      className="flex flex-col gap-(--space-3) rounded-lg border border-border-subtle bg-surface p-(--space-4)"
      data-testid="inbox-item"
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="sm" className="font-medium text-text-primary">
            {item.title}
          </Text>
          <Text size="sm" tone="secondary">
            {t(`kinds.${item.kind}`)}
          </Text>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">
          {formatCurrency(item.amount, item.currency, locale, {
            maximumFractionDigits: 0,
          })}
        </span>
      </div>

      {error ? (
        <StatusAlert
          variant="danger"
          title={t("resolve")}
          description={error}
        />
      ) : null}

      {jars.length === 0 ? (
        <StatusAlert
          variant="warning"
          title={t("noJarsTitle")}
          description={t("noJarsBody")}
        />
      ) : (
        <label className="flex flex-col gap-(--space-2)">
          <Text size="sm" className="font-semibold text-text-primary">
            {t("jarLabel")}
          </Text>
          <select
            className="min-h-11 w-full rounded-md border border-border-subtle bg-canvas px-(--space-3) text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            value={jarId}
            onChange={(e) => setJarId(e.target.value)}
            aria-label={t("jarLabel")}
            data-testid="inbox-jar-select"
          >
            {jars.map((jar) => (
              <option key={jar.id} value={jar.id}>
                {localizeCatalogName(tCatalog, "jars", jar.name)}
              </option>
            ))}
          </select>
        </label>
      )}

      <Button
        variant="primary"
        className="w-full"
        data-testid="inbox-resolve"
        isDisabled={isPending || !online || jars.length === 0}
        onPress={onResolve}
      >
        {isPending ? t("resolving") : t("resolve")}
      </Button>
    </li>
  );
}
