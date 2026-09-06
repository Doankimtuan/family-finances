"use client";

import { Spinner, Toast } from "@heroui/react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/utils/cn";

/**
 * Toast region host — must NOT wrap page children.
 * HeroUI Toast.Provider is a ToastRegion; its `children` are toast templates,
 * not the application tree. Mount as a sibling inside AppViewport.
 */
export function ToastProvider({
  hasBottomNavigation,
}: {
  hasBottomNavigation: boolean;
}) {
  const tA11y = useTranslations("a11y");

  return (
    <Toast.Provider
      placement="bottom"
      maxVisibleToasts={3}
      width="100%"
      className={cn(
        "vinha-toast-region",
        hasBottomNavigation
          ? "bottom-[calc(var(--bottom-navigation-height)+var(--space-3)+var(--safe-area-bottom))]"
          : "bottom-[calc(var(--space-3)+var(--safe-area-bottom))]",
      )}
    >
      {({ toast: queuedToast }) => {
        const content = queuedToast.content;
        const variant = content?.variant;

        return (
          <Toast toast={queuedToast} variant={variant} placement="bottom">
            {content?.indicator === null ? null : content?.isLoading ? (
              <Toast.Indicator variant={variant}>
                <Spinner color="current" size="sm" />
              </Toast.Indicator>
            ) : (
              <Toast.Indicator variant={variant}>
                {content?.indicator}
              </Toast.Indicator>
            )}
            <Toast.Content>
              {content?.title ? (
                <Toast.Title>{content.title}</Toast.Title>
              ) : null}
              {content?.description ? (
                <Toast.Description>{content.description}</Toast.Description>
              ) : null}
              {content?.actionProps ? (
                <Toast.ActionButton {...content.actionProps}>
                  {content.actionProps.children}
                </Toast.ActionButton>
              ) : null}
            </Toast.Content>
            <Toast.CloseButton aria-label={tA11y("dismissToast")} />
          </Toast>
        );
      }}
    </Toast.Provider>
  );
}
