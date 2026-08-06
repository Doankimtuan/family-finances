"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  HomeStatusLaneKind,
  HOME_STATUS_LANE_VARIANT,
  HOME_TEST_ID,
  HOME_TRANSLATION_NAMESPACE,
} from "@/modules/home/application/home-constants";
import { MutationOfflineBanner } from "@/shared/patterns/mutation-offline-banner";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Button } from "@/shared/ui/button";

export type { HomeStatusLaneKind };

export type HomeStatusLaneProps = {
  kind: HomeStatusLaneKind;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  "data-testid"?: string;
};

/**
 * Predictable Home region for offline, stale, partial, permission,
 * and recoverable error qualifiers. Renders before financial facts.
 */
export function HomeStatusLane({
  kind,
  title,
  description,
  onRetry,
  retryLabel,
  "data-testid": testId,
}: HomeStatusLaneProps) {
  const t = useTranslations(HOME_TRANSLATION_NAMESPACE);

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  }, [onRetry]);

  if (kind === HomeStatusLaneKind.OFFLINE) {
    return (
      <div data-testid={testId ?? HOME_TEST_ID.STATUS_OFFLINE}>
        <MutationOfflineBanner
          title={title ?? t("status.offline.title")}
          description={description ?? t("status.offline.description")}
        />
      </div>
    );
  }

  const variant = HOME_STATUS_LANE_VARIANT[kind];

  return (
    <div data-testid={testId ?? `${HOME_TEST_ID.STATUS_PREFIX}-${kind}`}>
      <StatusAlert
        variant={variant}
        title={title ?? t(`status.${kind}.title`)}
        description={description ?? t(`status.${kind}.description`)}
      />
      <Button
        variant="secondary"
        className="mt-(--space-3) w-full"
        onPress={handleRetry}
      >
        {retryLabel ?? t("status.retry")}
      </Button>
    </div>
  );
}
