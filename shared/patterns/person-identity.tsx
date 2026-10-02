import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  IconContainer,
  type IconContainerTone,
} from "@/shared/ui/icon-container";
import { cn } from "@/shared/utils/cn";

export type PersonIdentitySize = "sm" | "md" | "lg";

export type PersonIdentityProps = {
  name: ReactNode;
  subtitle?: ReactNode;
  caption?: ReactNode;
  avatarUrl?: string | null;
  initials?: string;
  tone?: IconContainerTone;
  size?: PersonIdentitySize;
  statusActive?: boolean;
  activeLabel?: string;
  className?: string;
  "data-testid"?: string;
};

/**
 * Unicode-safe initials extractor for any international name or email string.
 */
export function getPersonInitials(name?: string | null): string {
  if (!name) return "VN";
  const trimmed = name.trim();
  if (!trimmed) return "VN";

  // If email, use before @
  const cleanName = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "VN";
  if (parts.length === 1) {
    const single = parts[0];
    return Array.from(single).slice(0, 2).join("").toUpperCase();
  }
  const first = Array.from(parts[0])[0];
  const last = Array.from(parts[parts.length - 1])[0];
  return `${first}${last}`.toUpperCase();
}

/**
 * Standard person / member identity lockup (Avatar + Name + Status pip + Context).
 */
export function PersonIdentity({
  name,
  subtitle,
  caption,
  avatarUrl,
  initials,
  tone = "primary",
  size = "md",
  statusActive,
  activeLabel,
  className,
  "data-testid": testId,
}: PersonIdentityProps) {
  const resolvedSubtitle = subtitle ?? caption;
  const nameString = typeof name === "string" ? name : undefined;
  const derivedInitials = initials ?? getPersonInitials(nameString);

  const containerSize =
    size === "sm" ? "size-8" : size === "lg" ? "size-12" : "size-10";
  const textSize =
    size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <div
      className={cn("flex items-center gap-(--space-3)", className)}
      data-testid={testId}
    >
      <div className="relative flex shrink-0 items-center justify-center">
        {avatarUrl ? (
          <Avatar className={containerSize}>
            <AvatarImage src={avatarUrl} alt={nameString ?? "Avatar"} />
            <AvatarFallback>{derivedInitials}</AvatarFallback>
          </Avatar>
        ) : (
          <IconContainer tone={tone} size={size === "sm" ? "sm" : "md"}>
            <span
              className={cn("font-bold tracking-tight select-none", textSize)}
              aria-hidden
            >
              {derivedInitials}
            </span>
          </IconContainer>
        )}

        {statusActive !== undefined ? (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-surface",
              statusActive ? "bg-income" : "bg-text-muted",
            )}
            title={activeLabel}
            aria-label={activeLabel}
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="truncate text-sm font-semibold text-text-primary leading-snug">
          {name}
        </div>
        {resolvedSubtitle ? (
          <div className="truncate text-xs text-text-muted leading-tight">
            {resolvedSubtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
