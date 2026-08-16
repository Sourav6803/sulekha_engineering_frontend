import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  /** Mobile drawer — overlay open/closed. Never persisted; a fresh
   * navigation should never reopen the drawer on its own. */
  isOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;

  /** Desktop rail — collapsed to icon-only vs full width.
   * Persisted so the user's preference survives a refresh. */
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: false,
      openMobile: () => set({ isOpen: true }),
      closeMobile: () => set({ isOpen: false }),
      toggleMobile: () => set((state) => ({ isOpen: !state.isOpen })),

      isCollapsed: false,
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (value) => set({ isCollapsed: value }),
    }),
    {
      name: "sulekha-sidebar",
      // Only the desktop collapse preference is worth remembering
      // across sessions — mobile drawer state is deliberately excluded.
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
);