import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { getHouseholdPolicies } from "@/modules/tenancy/application/get-household-policies";
import { listPolicyEvents } from "@/modules/tenancy/application/list-policy-events";
import { TOGETHER_PATH } from "@/modules/tenancy/application/tenancy-constants";
import { Page } from "@/shared/patterns/page";
import { TopAppBar } from "@/shared/patterns/top-app-bar";
import { PoliciesForm } from "./policies-form";

const POLICY_EVENT_LIMIT = 5;

type Props = { params: Promise<{ locale: string }> };

export default async function PoliciesPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const { locale } = await requireTogetherMembership({
    localeParam,
    nextPath: TOGETHER_PATH.POLICIES,
  });

  const [policies, events, t] = await Promise.all([
    getHouseholdPolicies(),
    listPolicyEvents(POLICY_EVENT_LIMIT),
    getTranslations("together.policies"),
  ]);

  if (!policies) {
    return redirect({ href: TOGETHER_PATH.ROOT, locale });
  }

  return (
    <Page
      testId="together-policies-page"
      topBar={
        <TopAppBar
          variant="detail"
          backHref={TOGETHER_PATH.ROOT}
          title={t("title")}
          subtitle={`${policies.householdName} · ${
            policies.canEdit ? t("roleAdmin") : t("rolePartner")
          }`}
        />
      }
    >
      <PoliciesForm
        initial={{
          overspendPolicy: policies.overspendPolicy,
          monthCloseMode: policies.monthCloseMode,
          incomeAllocateMode: policies.incomeAllocateMode,
          canEdit: policies.canEdit,
        }}
        events={events}
      />
      <Link
        href={TOGETHER_PATH.ROOT}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-control)] border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary transition-[background-color,transform] duration-(--duration-fast) hover:bg-surface-hover active:scale-[var(--press-scale)] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        {t("back")}
      </Link>
    </Page>
  );
}
