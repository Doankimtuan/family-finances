import { cn } from "@/shared/utils/cn";

/**
 * Decorative soft ambient glow for auth screens. Non-interactive.
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
    </div>
  );
}
