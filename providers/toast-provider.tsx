"use client";

import { Toast } from "@heroui/react";

/**
 * Toast region host — must NOT wrap page children.
 * HeroUI Toast.Provider is a ToastRegion; its `children` are toast templates,
 * not the application tree. Mount as a sibling inside AppViewport.
 */
export function ToastProvider() {
  return (
    <Toast.Provider
      placement="bottom"
      maxVisibleToasts={3}
      width="min(100%, 400px)"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[var(--z-toast)] px-[var(--space-3)] pb-[var(--space-3)]"
    />
  );
}
