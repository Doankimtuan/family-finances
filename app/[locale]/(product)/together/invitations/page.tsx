import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { listPendingInvitations } from "@/modules/tenancy/application/list-pending-invitations";
import { TOGETHER_PATH } from "@/modules/tenancy/application/tenancy-constants";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { InvitationsPanel } from "./invitations-panel";

type Props = { params: Promise<{ locale: string }> };

export default async function InvitationsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.INVITATIONS,
  });

  const t = await getTranslations("together.invitations");
  const invitations = await listPendingInvitations();

  return (
    <div
      className="flex min-h-full flex-col"
      data-testid="together-invitations-page"
    >
      <TopAppBar title={t("title")} subtitle={t("subtitle")} />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
        <InvitationsPanel initialInvitations={invitations} />
        <Link
          href={TOGETHER_PATH.ROOT}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
