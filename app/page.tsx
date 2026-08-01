import Link from "next/link";
import { Heading } from "@/shared/ui/heading";
import { Text } from "@/shared/ui/text";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-[var(--space-4)] bg-[var(--color-canvas-outer)] px-[var(--space-6)] text-center">
      <Heading level={1}>ViNha</Heading>
      <Text tone="secondary">Rewrite workspace — bootstrap ready</Text>
      <Link
        href="/home"
        className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] px-[var(--space-4)] text-sm font-medium text-[var(--color-accent-fg)]"
      >
        Open app
      </Link>
    </div>
  );
}
