"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AuthScreenShell, BrandMark, Card } from "@/shared/patterns";
import { AlertVariant } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Heading } from "@/shared/ui/heading";
import { StatusAlert } from "@/shared/ui/status-alert";
import { Text } from "@/shared/ui/text";
import type { UserInvitation } from "@/modules/tenancy/application/list-user-invitations";
import { acceptOnboardingInvitationAction } from "./actions";
import { OnboardWizardScreen } from "./onboard-wizard-screen";

export function OnboardEntryScreen({
  invitations,
  lookupFailed,
}: {
  invitations: UserInvitation[];
  lookupFailed: boolean;
}) {
  const t = useTranslations("onboard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);
  const [acceptFailed, setAcceptFailed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasInvitations = invitations.length > 0;

  if (showWizard) return <OnboardWizardScreen />;

  const acceptInvitation = (invitationId: string) => {
    setAcceptFailed(false);
    startTransition(async () => {
      const result = await acceptOnboardingInvitationAction(invitationId);
      if (!result.ok) setAcceptFailed(true);
    });
  };

  return (
    <AuthScreenShell testId="onboard-entry" align="start" busy={isPending}>
      <div className="flex items-center gap-(--space-2)">
        <BrandMark variant="soft" size="sm" decorative />
        <Text size="sm" weight="semibold" className="text-text-primary">
          {tCommon("brand")}
        </Text>
      </div>
      <section className="flex flex-1 flex-col gap-(--space-4)">
        <div className="flex flex-col gap-(--space-2)">
          <Heading level={1}>
            {t(hasInvitations ? "invitationChoiceTitle" : "entryChoiceTitle")}
          </Heading>
          <Text tone="secondary">
            {t(
              hasInvitations
                ? "invitationChoiceDescription"
                : "entryChoiceDescription",
            )}
          </Text>
        </div>

        {lookupFailed ? (
          <StatusAlert
            variant={AlertVariant.WARNING}
            className="w-full flex-col items-stretch sm:flex-row sm:items-center"
            title={t("invitationLookupErrorTitle")}
            description={t("invitationLookupErrorBody")}
            action={
              <Button variant="tertiary" onPress={() => router.refresh()}>
                {t("retry")}
              </Button>
            }
          />
        ) : null}

        {acceptFailed ? (
          <StatusAlert
            variant={AlertVariant.DANGER}
            title={t("invitationAcceptErrorTitle")}
            description={t("invitationAcceptErrorBody")}
          />
        ) : null}

        {invitations.map((invitation) => (
          <Card key={invitation.id} tone="default" className="gap-(--space-3)">
            <div className="flex flex-col gap-(--space-1)">
              <Text size="xs" tone="secondary">
                {t("invitedToHousehold")}
              </Text>
              <Text weight="semibold" className="text-text-primary">
                {invitation.householdName}
              </Text>
            </div>
            <Button
              fullWidth
              isLoading={isPending}
              loadingText={t("acceptingInvitation")}
              isDisabled={isPending}
              onPress={() => acceptInvitation(invitation.id)}
            >
              {t("acceptInvitation")}
            </Button>
          </Card>
        ))}

        <div className="mt-auto flex flex-col gap-(--space-2) pt-(--space-2)">
          <Text size="sm" tone="secondary">
            {t("createOwnHouseholdDescription")}
          </Text>
          <Button
            variant="outlined"
            fullWidth
            isDisabled={isPending}
            onPress={() => setShowWizard(true)}
          >
            {t("createOwnHousehold")}
          </Button>
        </div>
      </section>
    </AuthScreenShell>
  );
}
