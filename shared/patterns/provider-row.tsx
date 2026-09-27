"use client";

import type { IconSvgElement } from "@hugeicons/react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { AppIcon } from "@/shared/ui/app-icon";
import { StitchBankIcon } from "@/shared/ui/stitch-icon-artwork";
import { cn } from "@/shared/utils/cn";
import { BaseRow, type BaseRowDivider, BaseRowMinHeight } from "./base-row";

export type ProviderLogoProps = {
  src?: string | null;
  name: string;
  initials?: string;
  fallbackIcon?: IconSvgElement;
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * Standardized 40x40px provider/bank logo container.
 * Safely falls back to clean bank initials or generic finance icon when the image fails or is missing.
 */
export function ProviderLogo({
  src,
  name,
  initials,
  fallbackIcon = StitchBankIcon,
  size = "md",
  className,
}: ProviderLogoProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClass =
    size === "sm"
      ? "size-8 text-[11px]"
      : size === "lg"
        ? "size-12 text-sm"
        : "size-10 text-xs";

  const parts = name.trim().split(/\s+/).filter(Boolean);
  const derivedInitials =
    initials ??
    (parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase());

  const showImage = Boolean(src) && !imageError;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-border-subtle bg-surface-subtle",
        sizeClass,
        className,
      )}
      aria-label={name}
    >
      {showImage && src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="48px"
          className="object-contain p-1"
          onError={() => setImageError(true)}
        />
      ) : derivedInitials ? (
        <span
          className="font-bold text-text-secondary select-none tracking-tight"
          aria-hidden
        >
          {derivedInitials}
        </span>
      ) : (
        <AppIcon icon={fallbackIcon} size="md" className="text-text-muted" />
      )}
    </div>
  );
}

export type ProviderRowProps = {
  name?: ReactNode;
  providerName?: ReactNode;
  logo?: ReactNode;
  logoSrc?: string | null;
  categoryDetail?: ReactNode;
  accountIdentifier?: ReactNode;
  connectionStatus?:
    "connected" | "disconnected" | "syncing" | "error" | string;
  action?: ReactNode;
  isSelected?: boolean;
  href?: string;
  onClick?: () => void;
  onPress?: () => void;
  divider?: BaseRowDivider;
  className?: string;
  "aria-label"?: string;
  "data-testid"?: string;
};

/**
 * Standard banking / investment provider selection row.
 */
export function ProviderRow({
  name,
  providerName,
  logo,
  logoSrc,
  categoryDetail,
  accountIdentifier,
  connectionStatus,
  action,
  isSelected = false,
  href,
  onClick,
  onPress,
  divider = "inset",
  className,
  "aria-label": ariaLabel,
  "data-testid": testId,
}: ProviderRowProps) {
  const resolvedName = name ?? providerName ?? "Provider";
  const nameString =
    typeof resolvedName === "string" ? resolvedName : "Provider";
  const leadingSlot = logo ?? <ProviderLogo src={logoSrc} name={nameString} />;

  const resolvedSubtitle =
    categoryDetail ??
    (accountIdentifier ? (
      <span className="truncate">{accountIdentifier}</span>
    ) : undefined);

  const statusLabel =
    connectionStatus === "connected"
      ? "Đã kết nối"
      : connectionStatus === "syncing"
        ? "Đang đồng bộ"
        : connectionStatus === "error"
          ? "Lỗi kết nối"
          : connectionStatus === "disconnected"
            ? "Chưa kết nối"
            : connectionStatus;

  const trailingSlot = statusLabel ? (
    <span
      className={cn(
        "text-xs font-medium",
        connectionStatus === "connected" && "text-income",
        connectionStatus === "syncing" && "text-primary",
        connectionStatus === "error" && "text-debt",
        connectionStatus === "disconnected" && "text-text-muted",
      )}
    >
      {statusLabel}
    </span>
  ) : null;

  return (
    <BaseRow
      leading={leadingSlot}
      title={resolvedName}
      subtitle={resolvedSubtitle}
      trailing={trailingSlot}
      action={action}
      selected={isSelected}
      minHeight={BaseRowMinHeight.STANDARD}
      divider={divider}
      href={href}
      onClick={onClick}
      onPress={onPress}
      className={className}
      aria-label={ariaLabel}
      data-testid={testId}
    />
  );
}
