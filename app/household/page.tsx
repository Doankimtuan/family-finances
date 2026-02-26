import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AcceptInviteForm } from "@/app/household/_components/accept-invite-form";
import { CreateHouseholdForm } from "@/app/household/_components/create-household-form";
import { InviteMemberForm } from "@/app/household/_components/invite-member-form";
import { createClient } from "@/lib/supabase/server";

type HouseholdPageProps = {
  searchParams?: Promise<{ token?: string }>;
};

function getOriginFromHeaders(headerList: Headers): string {
  const protocol = headerList.get("x-forwarded-proto") ?? "http";
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";

  return `${protocol}://${host}`;
}

export default async function HouseholdPage({ searchParams }: HouseholdPageProps) {
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
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <section className="mx-auto w-full max-w-2xl space-y-4">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Household Lifecycle</p>
          <h1 className="text-2xl font-semibold text-slate-900">Create, invite, and collaborate</h1>
          <p className="mt-1 text-sm text-slate-600">
            Both partners have equal access by default. Add data once and maintain a single shared truth.
          </p>
        </header>

        {!householdId ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Create your household</h2>
            <p className="mt-1 text-sm text-slate-600">
              Start by creating a household workspace. You can invite your partner immediately after.
            </p>
            <div className="mt-4">
              <CreateHouseholdForm />
            </div>
          </article>
        ) : (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Current household</h2>
            <p className="mt-1 text-sm text-slate-600">{householdName ?? "Unnamed household"}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Go to Dashboard
              </Link>
            </div>
          </article>
        )}

        {householdId ? (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Invite partner</h2>
            <p className="mt-1 text-sm text-slate-600">
              Send an invite token to your partner. They can accept it from this page.
            </p>
            <div className="mt-4">
              <InviteMemberForm />
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-sm font-medium text-slate-700">Pending invitations</p>
              {pendingHouseholdInvites?.data && pendingHouseholdInvites.data.length > 0 ? (
                <ul className="space-y-2">
                  {pendingHouseholdInvites.data.map((invite) => {
                    const inviteLink = `${origin}/household?token=${invite.token}`;

                    return (
                      <li key={invite.id} className="rounded-xl border border-slate-200 p-3">
                        <p className="text-sm font-medium text-slate-900">{invite.email}</p>
                        <p className="mt-1 break-all text-xs text-slate-600">Token: {invite.token}</p>
                        <p className="mt-1 break-all text-xs text-slate-600">Link: {inviteLink}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Expires: {new Date(invite.expires_at).toLocaleString("en-US")}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No pending invitations.</p>
              )}
            </div>
          </article>
        ) : null}

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Accept invitation</h2>
          <p className="mt-1 text-sm text-slate-600">
            Paste the invitation token you received, or use the prefilled token from your invite link.
          </p>

          <div className="mt-4">
            <AcceptInviteForm defaultToken={queryToken} />
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-sm font-medium text-slate-700">Your pending invites</p>
            {pendingReceivedInvites.data && pendingReceivedInvites.data.length > 0 ? (
              <ul className="space-y-2">
                {pendingReceivedInvites.data.map((invite) => (
                  <li key={invite.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="break-all text-xs text-slate-600">Token: {invite.token}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Expires: {new Date(invite.expires_at).toLocaleString("en-US")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No invitations waiting for your email.</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
