import { getTranslations } from "next-intl/server";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { listPendingInvitations } from "@/modules/tenancy/application/list-pending-invitations";
import {
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { TogetherPrimaryLink } from "@/shared/patterns/together-management";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { InvitationsPanel } from "./invitations-panel";

type Props = { params: Promise<{ locale: string }> };

export default async function InvitationsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const { membership } = await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.INVITATIONS,
  });

  const t = await getTranslations("together.invitations");
  const invitations = await listPendingInvitations();

  return (
    <Page
      testId="together-invitations-page"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={TOGETHER_PATH.ROOT}
          title={t("title")}
          subtitle={t("subtitle")}
        />
      }
    >
      {membership.role === HOUSEHOLD_ROLE.ADMIN ? (
        <TogetherPrimaryLink
          href={TOGETHER_PATH.INVITATIONS_NEW}
          testId="invite-new"
        >
          <AppIcon icon={ACTION_ICONS.add} size="sm" />
          {t("new")}
        </TogetherPrimaryLink>
      ) : null}
      <InvitationsPanel initialInvitations={invitations} />
    </Page>
  );
}
