"use client";

import { useCallback, useState, type ReactNode } from "react";
import { UNSAFE_PortalProvider } from "react-aria/PortalProvider";
import { cn } from "@/shared/utils/cn";
import { useModal } from "@/providers/modal-provider";
import { StatusAlertHost } from "@/providers/status-alert-provider";
import { ToastProvider } from "@/providers/toast-provider";
import { SafeArea } from "@/providers/safe-area";

/**
 * Application viewport — max 440px, centered on desktop decorative canvas.
 * PortalProvider + transform create a containing block so RAC/HeroUI
 * overlays and toasts stay inside the phone canvas.
 */
export function AppViewport({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { open, content } = useModal();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  const setViewportRef = useCallback((node: HTMLDivElement | null) => {
    setPortalRoot(node);
  }, []);

  return (
    <div
      className={cn(
        "flex h-dvh max-h-dvh w-full justify-center overflow-hidden bg-canvas-outer [background-image:var(--canvas-atmosphere)] min-[481px]:p-(--space-4)",
        className,
      )}
    >
      <div
        ref={setViewportRef}
        id="app-viewport-root"
        className={cn(
          "relative flex h-full max-h-dvh w-full flex-col overflow-hidden",
          "min-w-0 max-w-[var(--app-viewport-max)]",
          "bg-canvas text-text-primary",
          "min-[481px]:rounded-[var(--radius-xl)] min-[481px]:shadow-[var(--elevation-2)]",
          "isolate [transform:translateZ(0)]",
        )}
      >
        <UNSAFE_PortalProvider getContainer={() => portalRoot}>
          <SafeArea
            edges={["top"]}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            {children}
          </SafeArea>
          <StatusAlertHost />
          <ToastProvider />
          {open && content ? (
            <div
              id="modal-host"
              className="absolute inset-0 z-[var(--z-modal)]"
              aria-live="polite"
            >
              {content}
            </div>
          ) : null}
        </UNSAFE_PortalProvider>
      </div>
    </div>
  );
}
