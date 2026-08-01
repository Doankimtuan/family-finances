"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ModalContextValue = {
  open: boolean;
  content: ReactNode | null;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

/**
 * Modal state foundation. Visual host lives inside AppViewport.
 */
export function ModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);

  const openModal = useCallback((next: ReactNode) => {
    setContent(next);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setContent(null);
  }, []);

  const value = useMemo(
    () => ({ open, content, openModal, closeModal }),
    [open, content, openModal, closeModal],
  );

  return (
    <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return ctx;
}
