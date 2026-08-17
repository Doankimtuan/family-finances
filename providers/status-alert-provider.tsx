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
import { StatusAlert, type StatusAlertProps } from "@/shared/ui/status-alert";

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

type StatusAlertState = {
  current: StatusAlertOptions | null;
};

const StatusAlertActionsContext = createContext<StatusAlertController | null>(
  null,
);
const StatusAlertStateContext = createContext<StatusAlertState | null>(null);

const MISSING_PROVIDER_ERROR =
  "useStatusAlert must be used within StatusAlertProvider";

function useStatusAlertActions(): StatusAlertController {
  const ctx = useContext(StatusAlertActionsContext);
  if (!ctx) {
    throw new Error(MISSING_PROVIDER_ERROR);
  }
  return ctx;
}

function useStatusAlertState(): StatusAlertState {
  const ctx = useContext(StatusAlertStateContext);
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

  const actions = useMemo(() => ({ show, hide }), [show, hide]);
  const state = useMemo(() => ({ current }), [current]);

  return (
    <StatusAlertActionsContext.Provider value={actions}>
      <StatusAlertStateContext.Provider value={state}>
        {children}
      </StatusAlertStateContext.Provider>
    </StatusAlertActionsContext.Provider>
  );
}

export function useStatusAlert(): StatusAlertController {
  return useStatusAlertActions();
}

/**
 * Single viewport host. Renders at most one StatusAlert.
 */
export function StatusAlertHost() {
  const { current } = useStatusAlertState();
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
