import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AcceptInviteForm } from "@/app/household/_components/accept-invite-form";
import { CreateHouseholdForm } from "@/app/household/_components/create-household-form";
import { InviteMemberForm } from "@/app/household/_components/invite-member-form";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { normalizeHouseholdLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

type HouseholdPageProps = {
  searchParams?: Promise<{ token?: string }>;
};

function getOriginFromHeaders(headerList: Headers): string {
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host =
    headerList.get("x-forwarded-host") ??
    headerList.get("host") ??
    "family-finances-iota.vercel.app";

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
  let householdLocale = "en-US";

  if (householdId) {
    const householdResult = await supabase
      .from("households")
      .select("name, locale")
      .eq("id", householdId)
      .maybeSingle();

    householdName = householdResult.data?.name ?? null;
    householdLocale = normalizeHouseholdLocale(householdResult.data?.locale);
  }

  const [pendingReceivedInvites, pendingHouseholdInvites, requestHeaders] =
    await Promise.all([
      supabase
        .from("household_invitations")
        .select("id, token, expires_at")
        .eq("status", "pending")
        .eq("email", user.email)
        .order("created_at", { ascending: false }),
      householdId
        ? supabase
            .from("household_invitations")
            .select("id, email, token, status, expires_at")
            .eq("household_id", householdId)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
        : Promise.resolve(null),
      headers(),
    ]);

  const origin = getOriginFromHeaders(requestHeaders as Headers);

  return (
    <AppShell
      header={<AppHeader title="Household Settings" />}
      footer={<BottomTabBar />}
    >
      <div className="space-y-6">
        {!householdId ? (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Create your household
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start by creating a household workspace. You can invite your
                partner immediately after.
              </p>
              <div className="mt-6">
                <CreateHouseholdForm />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Current household
              </h2>
              <p className="mt-2 text-xl font-medium text-foreground">
                {householdName ?? "Unnamed household"}
              </p>
              <div className="mt-5">
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <a href="/dashboard">Go to Dashboard</a>
                  </Button>
                  <Button asChild variant="outline" className="text-black">
                    <a href="/settings">Open Settings</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {householdId ? (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Invite partner
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Send an invite token to your partner. They can accept it from
                this page.
              </p>
              <div className="mt-6">
                <InviteMemberForm />
              </div>

              <div className="mt-8 space-y-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
                          className="rounded-xl border border-border bg-muted/30 p-4"
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {invite.email}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="break-all text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Token:
                              </span>{" "}
                              {invite.token}
                            </p>
                            <p className="break-all text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">
                                Link:
                              </span>{" "}
                              {inviteLink}
                            </p>
                            <p className="text-xs text-muted-foreground/60">
                              Expires:{" "}
                              {new Date(invite.expires_at).toLocaleString(
                                householdLocale,
                              )}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No pending invitations.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Accept invitation
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste the invitation token you received to join a household.
            </p>

            <div className="mt-6">
              <AcceptInviteForm defaultToken={queryToken} />
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Your pending invites
              </p>
              {pendingReceivedInvites.data &&
              pendingReceivedInvites.data.length > 0 ? (
                <ul className="space-y-3">
                  {pendingReceivedInvites.data.map((invite) => (
                    <li
                      key={invite.id}
                      className="rounded-xl border border-border bg-muted/30 p-4"
                    >
                      <p className="break-all text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">
                          Token:
                        </span>{" "}
                        {invite.token}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        Expires:{" "}
                        {new Date(invite.expires_at).toLocaleString(
                          householdLocale,
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No invitations waiting for your email.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
