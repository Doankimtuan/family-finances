import { Link } from "@/i18n/navigation";
import { APP_PATH } from "@/modules/shared-kernel/app-path";
import { PRODUCT_LINK_PREFETCH } from "@/shared/constants/navigation";
import { AppIcon, AppIconSize } from "@/shared/ui/app-icon";
import { NAVIGATION_ICONS } from "@/shared/ui/icon-registry";
import { cn } from "@/shared/utils/cn";

export function TogetherHeaderTab({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={APP_PATH.TOGETHER}
      prefetch={PRODUCT_LINK_PREFETCH}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-(--space-2) rounded-full border px-(--space-3)",
        "text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        "transition-[background-color,border-color,color] duration-(--duration-fast) ease-(--ease-standard) motion-reduce:transition-none",
        active
          ? "border-primary/30 bg-primary-soft text-primary"
          : "border-border-subtle bg-surface text-text-secondary hover:bg-surface-hover",
      )}
      data-testid="together-header-tab"
    >
      <AppIcon icon={NAVIGATION_ICONS.together} size={AppIconSize.SM} />
      {label}
    </Link>
  );
}
