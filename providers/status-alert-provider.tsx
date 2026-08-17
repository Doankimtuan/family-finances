"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AlertVariant } from "@/shared/ui/alert";
import {
  StatusAlert,
  type StatusAlertProps,
} from "@/shared/ui/status-alert";

export type StatusAlertOptions = Pick<
  StatusAlertProps,
  "title" | "description"
> & {
  variant: AlertVariant;
};

export type StatusAlertController = {
  show: (options: StatusAlertOptions) => void;
  hide: () => void;
};

type StatusAlertContextValue = StatusAlertController & {
  current: StatusAlertOptions | null;
};

const StatusAlertContext = createContext<StatusAlertContextValue | null>(null);

const MISSING_PROVIDER_ERROR =
  "useStatusAlert must be used within StatusAlertProvider";

function useStatusAlertContext(): StatusAlertContextValue {
  const ctx = useContext(StatusAlertContext);
  if (!ctx) {
    throw new Error(MISSING_PROVIDER_ERROR);
  }
  return ctx;
}

/**
 * Global StatusAlert state. Visual host lives inside AppViewport.
 */
export function StatusAlertProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<StatusAlertOptions | null>(null);

  const show = useCallback((options: StatusAlertOptions) => {
    setCurrent(options);
  }, []);

  const hide = useCallback(() => {
    setCurrent(null);
  }, []);

  const value = useMemo(
    () => ({ current, show, hide }),
    [current, show, hide],
  );

  return (
    <StatusAlertContext.Provider value={value}>
      {children}
    </StatusAlertContext.Provider>
  );
}

export function useStatusAlert(): StatusAlertController {
  const { show, hide } = useStatusAlertContext();
  return { show, hide };
}

/**
 * Single viewport host. Renders at most one StatusAlert.
 */
export function StatusAlertHost() {
  const { current } = useStatusAlertContext();
  if (!current) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-(--z-toast) px-(--space-3) pt-[max(var(--space-3),var(--safe-area-top))]"
      aria-live="polite"
      data-testid="status-alert-host"
      data-variant={current.variant}
    >
      <div className="pointer-events-auto">
        <StatusAlert
          variant={current.variant}
          title={current.title}
          description={current.description}
        />
      </div>
    </div>
  );
}
