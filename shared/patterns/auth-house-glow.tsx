import { cn } from "@/shared/utils/cn";
import { BRAND_MARK_PATH } from "@/shared/patterns/brand-mark";

/**
 * Decorative soft ambient glow + faint Cradle & Seed watermark for auth screens.
 * Non-interactive; pointer-events-none.
 */
export function AuthHouseGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden",
        "h-56",
        className,
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-accent/15 via-accent/3 to-transparent" />
      <div className="absolute -bottom-16 left-1/2 h-36 w-3/4 -translate-x-1/2 rounded-full bg-accent/8 blur-3xl" />
      <svg
        className="absolute bottom-6 left-1/2 h-28 w-28 -translate-x-1/2 text-accent opacity-[0.08]"
        viewBox="0 0 32 32"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={BRAND_MARK_PATH} />
      </svg>
    </div>
  );
}
