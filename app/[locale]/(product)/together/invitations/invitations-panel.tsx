"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Text } from "@/shared/ui/text";
import { Button } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { SectionHeader } from "@/shared/patterns/section-header";
import { useStatusAlert } from "@/providers/status-alert-provider";
import type { PendingInvitation } from "@/modules/tenancy/application/list-pending-invitations";
import { invitePath } from "@/modules/tenancy/application/tenancy-constants";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer } from "@/shared/ui/icon-container";
import { StatusBadge } from "@/shared/ui/status-badge";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { revokeInvitationAction } from "../invite-actions";

function inviteShareUrl(locale: string, token: string): string {
  const path = `/${locale}${invitePath(token)}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function InvitationsPanel({
  initialInvitations,
}: {
  initialInvitations: PendingInvitation[];
}) {
  const t = useTranslations("together.invitations");
  const locale = useLocale();
  const router = useRouter();
  const statusAlert = useStatusAlert();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onRevoke = (id: string) => {
    statusAlert.hide();
    startTransition(async () => {
      const result = await revokeInvitationAction(id);
      if (result.status === "success") {
        router.refresh();
        return;
      }
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: t("pendingTitle"),
        description: t(`errors.${result.code}`),
      });
    });
  };

  const onCopy = async (id: string, link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
    } catch {
      statusAlert.show({
        variant: AlertVariant.DANGER,
        title: t("pendingTitle"),
        description: t("copyError"),
      });
    }
  };

  return (
    <div
      className="flex flex-col gap-(--space-4)"
      data-testid="together-invitations"
    >
      <SectionHeader
        title={t("pendingTitle")}
        description={
          initialInvitations.length > 0
            ? t("pendingDescription")
            : t("emptyDescription")
        }
      />
      {initialInvitations.length === 0 ? (
        <EmptyState
          title={t("emptyTitle")}
          description={t("emptyDescription")}
          icon={
            <AppIcon
              icon={NAVIGATION_ICONS.together}
              size={AppIconSize.DISPLAY}
            />
          }
          className="flex-none py-(--space-6)"
        />
      ) : (
        <ul className="flex flex-col gap-(--space-2)">
          {initialInvitations.map((invite) => {
            const link = inviteShareUrl(locale, invite.token);
            return (
              <li key={invite.id}>
                <Card tone="warning" className="gap-(--space-3) p-(--space-4)">
                  <div className="flex items-start gap-(--space-3)">
                    <IconContainer tone="primary" size="sm">
                      <AppIcon icon={NAVIGATION_ICONS.together} size="sm" />
                    </IconContainer>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-(--space-2)">
                        <Text
                          size="sm"
                          className="min-w-0 truncate font-semibold text-text-primary"
                        >
                          {invite.email}
                        </Text>
                        <StatusBadge tone="warning" className="shrink-0">
                          {t("pendingTitle")}
                        </StatusBadge>
                      </div>
                      <Text size="xs" tone="secondary" className="mt-1">
                        {t("expires", {
                          date: new Date(invite.expiresAt).toLocaleDateString(
                            locale,
                          ),
                        })}
                      </Text>
                    </div>
                  </div>
                  <div className="flex flex-col gap-(--space-2)">
                    <Button
                      variant="secondary"
                      className="w-full"
                      data-testid="invite-copy"
                      onPress={() => void onCopy(invite.id, link)}
                    >
                      {copiedId === invite.id ? t("copied") : t("copyLink")}
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full"
                      data-testid="invite-revoke"
                      isDisabled={isPending}
                      onPress={() => onRevoke(invite.id)}
                    >
                      {t("revoke")}
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
