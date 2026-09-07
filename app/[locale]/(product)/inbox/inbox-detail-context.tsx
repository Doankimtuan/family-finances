import type { ReactNode } from "react";
import { INBOX_TEST_ID } from "@/modules/inbox/application/inbox-constants";
import { Card } from "@/shared/patterns/card";
import { StatusBadge, StatusBadgeTone } from "@/shared/ui/status-badge";
import { Text } from "@/shared/ui/text";
import { InboxPrivacyToggle } from "./inbox-privacy-toggle";

type InboxDetailContextProps = {
  pending: boolean;
  heading: string;
  question: string | null;
  statusLabel: string;
  partnerNote: string;
  lifecycleLabel: string | null;
};

/**
 * Decision-context surface for Inbox detail. Pending work uses the
 * highlighted attention treatment; history stays quiet. Not a money hero.
 */
export function InboxDetailContext({
  pending,
  heading,
  question,
  statusLabel,
  partnerNote,
  lifecycleLabel,
}: InboxDetailContextProps) {
  return (
    <Card
      tone={pending ? "highlighted" : "soft"}
      className="gap-(--space-3) p-(--space-4)"
      data-testid={INBOX_TEST_ID.DETAIL_CONTEXT}
    >
      <div className="flex items-start justify-between gap-(--space-3)">
        <div className="min-w-0">
          <Text size="xs" tone="muted" className="font-medium tracking-wide">
            {heading}
          </Text>
          {question ? (
            <Text
              weight="semibold"
              className="mt-(--space-1) text-lg tracking-tight text-text-primary text-balance"
              data-testid={INBOX_TEST_ID.DECISION_QUESTION}
            >
              {question}
            </Text>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-(--space-2)">
          <StatusBadge
            tone={pending ? StatusBadgeTone.WARNING : StatusBadgeTone.NEUTRAL}
          >
            {statusLabel}
          </StatusBadge>
          <InboxPrivacyToggle testId={INBOX_TEST_ID.DETAIL_PRIVACY} />
        </div>
      </div>
      <Text
        size="xs"
        tone="muted"
        className="text-pretty"
        data-testid={INBOX_TEST_ID.PARTNER_EQUAL}
      >
        {partnerNote}
      </Text>
      {lifecycleLabel ? (
        <div className="border-t border-border-subtle/70 pt-(--space-3)">
          <Text
            size="sm"
            weight="medium"
            className="text-pretty text-text-primary"
            data-testid={INBOX_TEST_ID.LIFECYCLE}
          >
            {lifecycleLabel}
          </Text>
        </div>
      ) : null}
    </Card>
  );
}

type InboxDetailSourceProps = {
  title: string;
  kindLabel: string;
  amountLabel: ReactNode;
  leading?: ReactNode;
  subtitle?: string;
  statusTone: StatusBadgeTone;
};

/**
 * Source identity for the review. Amount stays context, not a household hero.
 */
export function InboxDetailSource({
  title,
  kindLabel,
  amountLabel,
  leading,
  subtitle,
  statusTone,
}: InboxDetailSourceProps) {
  return (
    <Card
      tone="elevated"
      className="gap-(--space-3) p-(--space-4)"
      data-testid={INBOX_TEST_ID.DETAIL_CARD}
    >
      <div className="flex items-start gap-(--space-3)">
        {leading}
        <div className="min-w-0 flex-1">
          <Text
            weight="semibold"
            className="wrap-break-word text-pretty text-text-primary"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              size="sm"
              tone="secondary"
              className="mt-(--space-1) text-pretty"
            >
              {subtitle}
            </Text>
          ) : null}
        </div>
        <StatusBadge tone={statusTone}>{kindLabel}</StatusBadge>
      </div>
      <div className="border-t border-border-subtle/70 pt-(--space-3)">
        <p className="font-semibold tabular-nums tracking-tight text-text-primary text-xl">
          {amountLabel}
        </p>
      </div>
    </Card>
  );
}
