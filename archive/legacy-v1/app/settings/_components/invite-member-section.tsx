"use client";

import { Card, CardContent } from "@/components/ui/card";
import { InviteForm } from "./invite/invite-form";
import { AcceptForm } from "./invite/accept-form";

type OutgoingInvite = {
  id: string;
  email: string;
  token: string;
  expires_at: string;
};

type IncomingInvite = {
  id: string;
  token: string;
  expires_at: string;
  households: { name: string } | null;
};

type Props = {
  origin: string;
  outgoingInvites: OutgoingInvite[];
  incomingInvites: IncomingInvite[];
  language: "vi" | "en";
};

export function InviteMemberSection({
  origin,
  outgoingInvites,
  incomingInvites,
}: Props) {
  return (
    <div className="space-y-6">
      {/* ── Send Invitation ─────────────────────────────────────────────── */}
      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <InviteForm origin={origin} outgoingInvites={outgoingInvites} />
        </CardContent>
      </Card>

      {/* ── Accept Invitation ───────────────────────────────────────────── */}
      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <AcceptForm incomingInvites={incomingInvites} />
        </CardContent>
      </Card>
    </div>
  );
}
