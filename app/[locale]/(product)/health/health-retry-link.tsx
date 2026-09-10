import { Link } from "@/i18n/navigation";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";

export function HealthRetryLink({
  href,
  label,
  testId,
}: {
  href: string;
  label: string;
  testId: string;
}) {
  return (
    <Link
      href={href}
      prefetch={PRODUCT_LINK_PREFETCH}
      className="inline-flex min-h-11 items-center rounded-(--radius-control) px-(--space-2) text-sm font-semibold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      data-testid={testId}
    >
      {label}
    </Link>
  );
}
