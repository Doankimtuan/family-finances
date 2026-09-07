"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Text } from "@/shared/ui/text";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { AlertVariant } from "@/shared/ui/alert";
import { Card } from "@/shared/patterns/card";
import { EmptyState } from "@/shared/patterns/empty-state";
import { SectionHeader } from "@/shared/patterns/section-header";
import { useStatusAlert } from "@/providers/status-alert-provider";
import type { PendingInvitation } from "@/modules/tenancy/application/list-pending-invitations";
import { invitePath } from "@/modules/tenancy/application/tenancy-constants";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { IconContainer, IconContainerTone } from "@/shared/ui/icon-container";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { UTILITY_ICONS } from "@/shared/ui/icon-registry";
import { revokeInvitationAction } from "../invite-actions";
import { InviteRevokeConfirmSheet } from "./invite-revoke-confirm-sheet";

function inviteShareUrl(locale: string, token: string): string {
  const path = `/${locale}${invitePath(token)}`;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function PendingInvitationRow({
  invite,
  locale,
  copied,
  isRevokePending,
  onCopy,
  onRevoke,
}: {
  invite: PendingInvitation;
  locale: string;
  copied: boolean;
  isRevokePending: boolean;
  onCopy: (id: string, link: string) => void;
  onRevoke: (invitation: PendingInvitation) => void;
}) {
  const t = useTranslations("together.invitations");
  const link = inviteShareUrl(locale, invite.token);

  return (
    <li data-testid="together-invitation-row">
      <div className="flex flex-col gap-(--space-2) px-(--space-3) py-(--space-3)">
        <div className="flex items-start gap-(--space-3)">
          <IconContainer tone={IconContainerTone.INFO} size="sm">
            <AppIcon icon={UTILITY_ICONS.notification} size="sm" />
          </IconContainer>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-(--space-2)">
              <Text
                size="sm"
                className="min-w-0 truncate font-semibold text-text-primary"
              >
                {invite.email}
              </Text>
              <StatusBadge tone={StatusBadgeTone.WARNING} className="shrink-0">
                {t("pendingTitle")}
              </StatusBadge>
            </div>
            <Text size="xs" tone="secondary" className="mt-0.5 text-pretty">
              {t("expires", {
                date: new Date(invite.expiresAt).toLocaleDateString(locale),
              })}
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-(--space-2)">
          <Button
            variant={ButtonVariant.SECONDARY}
            className="min-h-11 min-w-0 flex-1"
            data-testid="invite-copy"
            onPress={() => void onCopy(invite.id, link)}
          >
            {copied ? t("copied") : t("copyLink")}
          </Button>
          <Button
            variant={ButtonVariant.GHOST}
            className="min-h-11 shrink-0 px-(--space-3)"
            data-testid="invite-revoke"
            isDisabled={isRevokePending}
            onPress={() => onRevoke(invite)}
          >
            {t("revoke")}
          </Button>
        </div>
      </div>
    </li>
  );
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
  const [invitationToRevoke, setInvitationToRevoke] =
    useState<PendingInvitation | null>(null);
  const [isPending, startTransition] = useTransition();

  const closeRevokeConfirm = () => {
    if (isPending) return;
    setInvitationToRevoke(null);
    statusAlert.hide();
  };

  const openRevokeConfirm = (invitation: PendingInvitation) => {
    if (isPending) return;
    statusAlert.hide();
    setInvitationToRevoke(invitation);
  };

  const onConfirmRevoke = () => {
    if (!invitationToRevoke || isPending) return;
    const invitationId = invitationToRevoke.id;
    statusAlert.hide();
    startTransition(async () => {
      const result = await revokeInvitationAction(invitationId);
      if (result.status === "success") {
        setInvitationToRevoke(null);
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
              icon={UTILITY_ICONS.notification}
              size={AppIconSize.DISPLAY}
            />
          }
          className="flex-none py-(--space-6)"
        />
      ) : (
        <Card
          tone="elevated"
          className="gap-0 overflow-hidden p-0"
          data-testid="together-invitation-list"
        >
          <ul className="divide-y divide-divider">
            {initialInvitations.map((invite) => (
              <PendingInvitationRow
                key={invite.id}
                invite={invite}
                locale={locale}
                copied={copiedId === invite.id}
                isRevokePending={isPending}
                onCopy={onCopy}
                onRevoke={openRevokeConfirm}
              />
            ))}
          </ul>
        </Card>
      )}
      <InviteRevokeConfirmSheet
        invitation={invitationToRevoke}
        isPending={isPending}
        onClose={closeRevokeConfirm}
        onConfirm={onConfirmRevoke}
      />
    </div>
  );
}
