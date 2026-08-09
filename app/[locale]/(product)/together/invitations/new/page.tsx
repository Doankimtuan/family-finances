import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { TOGETHER_PATH } from "@/modules/tenancy/application/tenancy-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { InvitationForm } from "./invitation-form";

type Props = { params: Promise<{ locale: string }> };

export default async function NewInvitationPage({ params }: Props) {
  const { locale: localeParam } = await params;
  await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.INVITATIONS_NEW,
  });
  const t = await getTranslations("together.invitations");

  return (
    <Page
      testId="together-invitation-new-page"
      topBar={<TopAppBar title={t("sendTitle")} subtitle={t("sendSubtitle")} />}
    >
      <InvitationForm />
      <Link
        href={TOGETHER_PATH.INVITATIONS}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t("backInvitations")}
      </Link>
    </Page>
  );
}
