"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  FINANCIAL_PRIVACY_STORAGE_KEY,
  FINANCIAL_PRIVACY_STORAGE_FALSE,
  FINANCIAL_PRIVACY_STORAGE_TRUE,
} from "@/shared/constants/financial-privacy";

type FinancialPrivacyContextValue = {
  isHidden: boolean;
  toggle: () => void;
};

const DEFAULT_VALUE: FinancialPrivacyContextValue = {
  isHidden: false,
  toggle: () => undefined,
};

const FinancialPrivacyContext =
  createContext<FinancialPrivacyContextValue>(DEFAULT_VALUE);

function readStoredPreference() {
  try {
    return (
      window.localStorage.getItem(FINANCIAL_PRIVACY_STORAGE_KEY) ===
      FINANCIAL_PRIVACY_STORAGE_TRUE
    );
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

function getServerSnapshot() {
  return false;
}

export function FinancialPrivacyProvider({
  children,
}: {
  children: ReactNode;
}) {
  const isHidden = useSyncExternalStore(
    subscribe,
    readStoredPreference,
    getServerSnapshot,
  );
  const toggle = () => {
    try {
      const nextValue = !readStoredPreference();
      window.localStorage.setItem(
        FINANCIAL_PRIVACY_STORAGE_KEY,
        nextValue
          ? FINANCIAL_PRIVACY_STORAGE_TRUE
          : FINANCIAL_PRIVACY_STORAGE_FALSE,
      );
      window.dispatchEvent(new StorageEvent("storage"));
    } catch {
      // Privacy preference is best-effort when storage is unavailable.
    }
  };

  return (
    <FinancialPrivacyContext.Provider value={{ isHidden, toggle }}>
      {children}
    </FinancialPrivacyContext.Provider>
  );
}

export function useFinancialPrivacy() {
  return useContext(FinancialPrivacyContext);
}
