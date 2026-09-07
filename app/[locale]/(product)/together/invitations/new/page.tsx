import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import {
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { InvitationForm } from "./invitation-form";

type Props = { params: Promise<{ locale: string }> };

export default async function NewInvitationPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const { locale, membership } = await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.INVITATIONS_NEW,
  });
  if (membership.role !== HOUSEHOLD_ROLE.ADMIN) {
    return redirect({ href: TOGETHER_PATH.INVITATIONS, locale });
  }
  const t = await getTranslations("together.invitations");

  return (
    <Page
      testId="together-invitation-new-page"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={TOGETHER_PATH.INVITATIONS}
          title={t("sendTitle")}
          subtitle={t("sendSubtitle")}
        />
      }
    >
      <InvitationForm />
    </Page>
  );
}
