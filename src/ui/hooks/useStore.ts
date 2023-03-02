import create from "zustand";
import { immer } from "zustand/middleware/immer";

export enum SidebarTabs {
  Home = "Home",
  Friends = "Friends",
  Notifications = "Notifications",
}

export enum OverlayWindow {
  CreateWorld = "create_world",
  UserProfile = "user_profile",
  WorldSettings = "world_settings",
  Discover = "Discover",
}

export interface UserProfileState {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  setUserId: (id: string) => void;
  setDisplayName: (name: string) => void;
  setAvatarUrl: (url?: string) => void;
}

export interface OverlaySidebarState {
  selectedSidebarTab: SidebarTabs;
  selectSidebarTab(tab: SidebarTabs): void;
}

export interface OverlayWindowState {
  selectedWindow?: OverlayWindow;
  worldSettingsId?: string;
  selectWindow(window: OverlayWindow): void;
  selectWorldSettingsWindow(roomId: string): void;
  closeWindow(): void;
}

export interface WorldState {
  worldId: string | undefined;
  entered: boolean;
  disposeNetworkInterface: (() => void) | undefined;
  setWorld(roomId: string): void;
  closeWorld(): void;
  setNetworkInterfaceDisposer(disposer: () => void): void;
}

export interface StoreState {
  userProfile: UserProfileState;
  overlaySidebar: OverlaySidebarState;
  overlayWindow: OverlayWindowState;
  world: WorldState;
}

export const useStore = create<StoreState>()(
  immer((set, get) => ({
    userProfile: {
      userId: "@dummy:server.xyz",
      displayName: "dummy",
      avatarUrl: undefined,
      setUserId: (id) => {
        set((state) => {
          state.userProfile.userId = id;
        });
      },
      setDisplayName: (name) => {
        set((state) => {
          state.userProfile.displayName = name;
        });
      },
      setAvatarUrl: (url) => {
        set((state) => {
          state.userProfile.avatarUrl = url;
        });
      },
    },
    overlaySidebar: {
      selectedSidebarTab: SidebarTabs.Home,
      selectSidebarTab(tab: SidebarTabs) {
        set((state) => {
          state.overlayWindow.selectedWindow = undefined;
          state.overlayWindow.worldSettingsId = undefined;
          state.overlaySidebar.selectedSidebarTab = tab;
        });
      },
    },
    overlayWindow: {
      selectedWindow: undefined,
      selectWindow(window: OverlayWindow) {
        set((state) => {
          state.overlayWindow.selectedWindow = window;
        });
      },
      selectWorldSettingsWindow(roomId) {
        set((state) => {
          state.overlayWindow.selectedWindow = OverlayWindow.WorldSettings;
          state.overlayWindow.worldSettingsId = roomId;
        });
      },
      closeWindow() {
        set((state) => {
          state.overlayWindow.selectedWindow = undefined;
          state.overlayWindow.worldSettingsId = undefined;
        });
      },
    },
    world: {
      worldId: undefined,
      entered: false,
      disposeNetworkInterface: undefined,
      setWorld(roomId) {
        set((state) => {
          state.world.worldId = roomId;
          if (!roomId) {
            state.world.entered = false;
          }
        });
      },
      closeWorld() {
        set((state) => {
          state.world.worldId = undefined;
          state.world.entered = false;
          state.world.disposeNetworkInterface = undefined;
        });
      },
      setNetworkInterfaceDisposer(disposer) {
        set((state) => {
          state.world.disposeNetworkInterface = disposer;
          state.world.entered = true;
        });
      },
    },
  }))
);
