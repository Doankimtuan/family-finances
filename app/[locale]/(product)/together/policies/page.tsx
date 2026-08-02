import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { requireTogetherMembership } from "@/modules/tenancy/application/require-together-membership";
import { getHouseholdPolicies } from "@/modules/tenancy/application/get-household-policies";
import { listPolicyEvents } from "@/modules/tenancy/application/list-policy-events";
import { TOGETHER_PATH } from "@/modules/tenancy/application/tenancy-constants";
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
    <div
      className="flex min-h-full flex-col"
      data-testid="together-policies-page"
    >
      <TopAppBar
        title={t("title")}
        subtitle={`${policies.householdName} · ${
          policies.canEdit ? t("roleAdmin") : t("rolePartner")
        }`}
      />
      <div className="flex flex-1 flex-col gap-(--space-5) px-(--space-4) pb-(--space-6) pt-(--space-4)">
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
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-subtle bg-surface px-(--space-4) text-sm font-medium text-text-primary"
        >
          {t("back")}
        </Link>
      </div>
    </div>
  );
}
