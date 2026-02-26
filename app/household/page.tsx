import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AcceptInviteForm } from "@/app/household/_components/accept-invite-form";
import { CreateHouseholdForm } from "@/app/household/_components/create-household-form";
import { InviteMemberForm } from "@/app/household/_components/invite-member-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

type HouseholdPageProps = {
  searchParams?: Promise<{ token?: string }>;
};

function getOriginFromHeaders(headerList: Headers): string {
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "localhost:3000";

  return `${protocol}://${host}`;
}

export default async function HouseholdPage({
  searchParams,
}: HouseholdPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : undefined;
  const queryToken = params?.token ?? "";

  const membershipResult = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const householdId = membershipResult.data?.household_id ?? null;

  let householdName: string | null = null;

  if (householdId) {
    const householdResult = await supabase
      .from("households")
      .select("name")
      .eq("id", householdId)
      .maybeSingle();

    householdName = householdResult.data?.name ?? null;
  }

  const pendingReceivedInvites = await supabase
    .from("household_invitations")
    .select("id, token, expires_at")
    .eq("status", "pending")
    .eq("email", user.email)
    .order("created_at", { ascending: false });

  const pendingHouseholdInvites = householdId
    ? await supabase
        .from("household_invitations")
        .select("id, email, token, status, expires_at")
        .eq("household_id", householdId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    : null;

  const requestHeaders = await headers();
  const origin = getOriginFromHeaders(requestHeaders);

  return (
    <AppShell
      header={<AppHeader title="Household Settings" />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6">
        {!householdId ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Create your household
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Start by creating a household workspace. You can invite your
              partner immediately after.
            </p>
            <div className="mt-6">
              <CreateHouseholdForm />
            </div>
          </article>
        ) : (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Current household
            </h2>
            <p className="mt-2 text-xl font-medium text-slate-800">
              {householdName ?? "Unnamed household"}
            </p>
            <div className="mt-5">
              <Button asChild>
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </div>
          </article>
        )}

        {householdId ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Invite partner
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Send an invite token to your partner. They can accept it from this
              page.
            </p>
            <div className="mt-6">
              <InviteMemberForm />
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Pending invitations
              </p>
              {pendingHouseholdInvites?.data &&
              pendingHouseholdInvites.data.length > 0 ? (
                <ul className="space-y-3">
                  {pendingHouseholdInvites.data.map((invite) => {
                    const inviteLink = `${origin}/household?token=${invite.token}`;

                    return (
                      <li
                        key={invite.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {invite.email}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="break-all text-xs text-slate-500">
                            <span className="font-medium text-slate-700">
                              Token:
                            </span>{" "}
                            {invite.token}
                          </p>
                          <p className="break-all text-xs text-slate-500">
                            <span className="font-medium text-slate-700">
                              Link:
                            </span>{" "}
                            {inviteLink}
                          </p>
                          <p className="text-xs text-slate-400">
                            Expires:{" "}
                            {new Date(invite.expires_at).toLocaleString(
                              "en-US",
                            )}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  No pending invitations.
                </p>
              )}
            </div>
          </article>
        ) : null}

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Accept invitation
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Paste the invitation token you received to join a household.
          </p>

          <div className="mt-6">
            <AcceptInviteForm defaultToken={queryToken} />
          </div>

          <div className="mt-8 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Your pending invites
            </p>
            {pendingReceivedInvites.data &&
            pendingReceivedInvites.data.length > 0 ? (
              <ul className="space-y-3">
                {pendingReceivedInvites.data.map((invite) => (
                  <li
                    key={invite.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                  >
                    <p className="break-all text-xs text-slate-500">
                      <span className="font-medium text-slate-700">Token:</span>{" "}
                      {invite.token}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Expires:{" "}
                      {new Date(invite.expires_at).toLocaleString("en-US")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 italic">
                No invitations waiting for your email.
              </p>
            )}
          </div>
        </article>
      </div>
    </AppShell>
  );
}
