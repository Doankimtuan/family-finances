import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { listPendingInvitations } from "@/modules/tenancy/application/list-pending-invitations";
import {
  HOUSEHOLD_ROLE,
  TOGETHER_PATH,
} from "@/modules/tenancy/application/tenancy-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
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
        <Link
          href={TOGETHER_PATH.INVITATIONS_NEW}
          data-testid="invite-new"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-control)] bg-accent px-(--space-4) text-sm font-semibold text-accent-fg shadow-[var(--elevation-1)] transition-[background-color,transform,box-shadow] duration-(--duration-fast) hover:-translate-y-px hover:shadow-[var(--elevation-2)] active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          {t("new")}
        </Link>
      ) : null}
      <InvitationsPanel initialInvitations={invitations} />
      <Link
        href={TOGETHER_PATH.ROOT}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t("back")}
      </Link>
    </Page>
  );
}
