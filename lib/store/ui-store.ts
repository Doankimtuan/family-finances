import { create } from "zustand";

type UiState = {
  selectedMonthRange: 6 | 12;
  setSelectedMonthRange: (range: 6 | 12) => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedMonthRange: 6,
  setSelectedMonthRange: (range) => set({ selectedMonthRange: range }),
}));
