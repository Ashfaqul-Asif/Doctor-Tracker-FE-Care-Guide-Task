import { create } from 'zustand';

interface UiState {
  /** Mobile navigation drawer. Desktop renders the sidebar unconditionally. */
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  toggleMobileNav: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
}));
