// import { create } from "zustand";

// interface UIState {
//   /** Header user-menu dropdown */
//   userMenuOpen: boolean;
//   setUserMenuOpen: (open: boolean) => void;
//   toggleUserMenu: () => void;

//   /** Collapsible nav groups inside the sidebar (e.g. "Inventory"
//    * containing Materials/Suppliers/Purchases) — keyed by group id. */
//   expandedNavGroups: Record<string, boolean>;
//   toggleNavGroup: (key: string) => void;
// }

// export const useUIStore = create<UIState>((set) => ({
//   userMenuOpen: false,
//   setUserMenuOpen: (open) => set({ userMenuOpen: open }),
//   toggleUserMenu: () => set((state) => ({ userMenuOpen: !state.userMenuOpen })),

//   expandedNavGroups: {},
//   toggleNavGroup: (key) =>
//     set((state) => ({
//       expandedNavGroups: { ...state.expandedNavGroups, [key]: !state.expandedNavGroups[key] },
//     })),
// }));




import { create } from "zustand";

interface UIState {
  /** Header user-menu dropdown */
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;
  toggleUserMenu: () => void;

  /** Header notification-bell dropdown */
  notificationMenuOpen: boolean;
  setNotificationMenuOpen: (open: boolean) => void;
  toggleNotificationMenu: () => void;

  /** Collapsible nav groups inside the sidebar (e.g. "Inventory"
   * containing Materials/Suppliers/Purchases) — keyed by group id. */
  expandedNavGroups: Record<string, boolean>;
  toggleNavGroup: (key: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  userMenuOpen: false,
  setUserMenuOpen: (open) => set({ userMenuOpen: open }),
  toggleUserMenu: () => set((state) => ({ userMenuOpen: !state.userMenuOpen })),

  notificationMenuOpen: false,
  setNotificationMenuOpen: (open) => set({ notificationMenuOpen: open }),
  toggleNotificationMenu: () => set((state) => ({ notificationMenuOpen: !state.notificationMenuOpen })),

  expandedNavGroups: {},
  toggleNavGroup: (key) =>
    set((state) => ({
      expandedNavGroups: { ...state.expandedNavGroups, [key]: !state.expandedNavGroups[key] },
    })),
}));