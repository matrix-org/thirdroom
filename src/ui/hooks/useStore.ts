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

export interface OverlayState {
  isOpen: boolean;
  openOverlay(): void;
  closeOverlay(): void;
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

export interface OverlayWorldState {
  selectedWorldId: string | undefined;
  selectWorld(roomId: string | undefined): void;
}

export interface OverlayChatState {
  selectedChatId: string | undefined;
  activeChats: Set<string>;
  selectChat(roomId: string | undefined): void;
  minimizeChat(roomId: string): void;
  closeChat(roomId: string): void;
}

export interface WorldState {
  worldId: string | undefined;
  entered: boolean;
  disposeNetworkInterface: (() => void) | undefined;
  setWorld(roomId: string): void;
  closeWorld(): void;
  setNetworkInterfaceDisposer(disposer: () => void): void;
}

export interface WorldChatState {
  isOpen: boolean;
  openWorldChat(): void;
  closeWorldChat(): void;
}

export interface PointerLockState {
  isPointerLock: boolean;
  setIsPointerLock(isPointerLock: boolean): void;
}

export interface StoreState {
  userProfile: UserProfileState;
  overlay: OverlayState;
  overlaySidebar: OverlaySidebarState;
  overlayWindow: OverlayWindowState;
  overlayChat: OverlayChatState;
  overlayWorld: OverlayWorldState;
  world: WorldState;
  worldChat: WorldChatState;
  pointerLock: PointerLockState;
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
    overlay: {
      isOpen: true,
      openOverlay() {
        set((state) => {
          state.overlay.isOpen = true;
        });
      },
      closeOverlay() {
        set((state) => {
          state.overlay.isOpen = false;
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
    overlayChat: {
      activeChats: new Set(),
      selectedChatId: undefined,
      selectChat(roomId: string) {
        set((state) => {
          if (!state.overlayChat.activeChats.has(roomId)) {
            state.overlayChat.activeChats.add(roomId);
          }

          if (state.overlayChat.selectedChatId === roomId) {
            state.overlayChat.selectedChatId = undefined;
          } else {
            state.overlayChat.selectedChatId = roomId;
          }
        });
      },
      minimizeChat(roomId: string) {
        set((state) => {
          state.overlayChat.selectedChatId = undefined;
        });
      },
      closeChat(roomId: string) {
        set((state) => {
          if (state.overlayChat.selectedChatId === roomId) {
            state.overlayChat.selectedChatId = undefined;
          }

          state.overlayChat.activeChats.delete(roomId);
        });
      },
    },
    overlayWorld: {
      selectedWorldId: undefined,
      selectWorld(roomId: string | undefined) {
        set((state) => {
          state.overlayChat.selectedChatId = undefined;
          state.overlayWorld.selectedWorldId = roomId;
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
    worldChat: {
      isOpen: false,
      openWorldChat() {
        set((state) => {
          state.worldChat.isOpen = true;
        });
      },
      closeWorldChat() {
        set((state) => {
          state.worldChat.isOpen = false;
        });
      },
    },
    pointerLock: {
      isPointerLock: false,
      setIsPointerLock(isPointerLock: boolean) {
        set((state) => {
          state.pointerLock.isPointerLock = isPointerLock;
        });
      },
    },
  }))
);
