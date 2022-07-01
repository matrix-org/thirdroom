import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { RoomId } from "@thirdroom/hydrogen-view-sdk";

export enum RoomListTabs {
  Home = "Home",
  Worlds = "Worlds",
  Chats = "Chats",
  Friends = "Friends",
}

export enum OverlayWindow {
  CreateWorld = "create_world",
  UserProfile = "user_profile",
}

export enum WorldLoadState {
  None = "none",
  Loading = "loading",
  Loaded = "loaded",
  Entering = "entering",
  Entered = "entered",
  Error = "error",
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
  selectedRoomListTab: RoomListTabs;
  selectRoomListTab(tab: RoomListTabs): void;
}

export interface OverlayWindowState {
  selectedWindow?: OverlayWindow;
  selectWindow(window?: OverlayWindow): void;
}

export interface OverlayWorldState {
  selectedWorldId: RoomId | undefined;
  selectWorld(roomId: RoomId | undefined): void;
}

export interface OverlayChatState {
  selectedChatId: RoomId | undefined;
  activeChats: Set<RoomId>;
  selectChat(roomId: RoomId | undefined): void;
  minimizeChat(roomId: RoomId): void;
  closeChat(roomId: RoomId): void;
}

export interface WorldState {
  joiningWorld: boolean;
  isEnteredWorld: boolean;
  worldId: RoomId | undefined;
  loadState: WorldLoadState;
  error?: Error;
  setInitialWorld(roomId: RoomId | undefined): void;
  loadingWorld(roomId: RoomId | undefined): void;
  loadedWorld(): void;
  setWorldError(error: Error): void;
  enteringWorld(): void;
  enteredWorld(): void;
  leftWorld(): void;
  joinWorld(): void;
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
      selectedRoomListTab: RoomListTabs.Home,
      selectRoomListTab(tab: RoomListTabs) {
        set((state) => {
          state.overlaySidebar.selectedRoomListTab = tab;
        });
      },
    },
    overlayWindow: {
      selectedWindow: undefined,
      selectWindow(window?: OverlayWindow) {
        set((state) => {
          state.overlayWindow.selectedWindow = window;
        });
      },
    },
    overlayChat: {
      activeChats: new Set(),
      selectedChatId: undefined,
      selectChat(roomId: RoomId) {
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
      minimizeChat(roomId: RoomId) {
        set((state) => {
          state.overlayChat.selectedChatId = undefined;
        });
      },
      closeChat(roomId: RoomId) {
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
      selectWorld(roomId: RoomId | undefined) {
        set((state) => {
          state.overlayChat.selectedChatId = undefined;
          state.overlayWorld.selectedWorldId = roomId;
        });
      },
    },
    world: {
      isEnteredWorld: false,
      worldId: undefined,
      loadState: WorldLoadState.None,
      error: undefined,
      joiningWorld: false,
      setInitialWorld(roomId: RoomId | undefined) {
        set((state) => {
          state.overlayWorld.selectedWorldId = roomId;
          state.world.worldId = roomId;
          state.world.error = undefined;
          state.world.loadState = WorldLoadState.None;
          state.overlayWindow.selectedWindow = undefined;
          state.world.joiningWorld = false;
        });
      },
      joinWorld() {
        set((state) => {
          state.world.joiningWorld = true;
        });
      },
      loadingWorld(roomId: RoomId | undefined) {
        set((state) => {
          state.overlayWorld.selectedWorldId = roomId;
          state.world.worldId = roomId;
          state.world.error = undefined;
          state.world.loadState = roomId ? WorldLoadState.Loading : WorldLoadState.None;
          state.world.joiningWorld = false;
        });
      },
      loadedWorld() {
        set((state) => {
          state.world.loadState = WorldLoadState.Loaded;
        });
      },
      setWorldError(error: Error) {
        set((state) => {
          state.world.loadState = WorldLoadState.Error;
          state.world.error = error as Error;
        });
      },
      enteringWorld() {
        set((state) => {
          state.world.loadState = WorldLoadState.Entering;
        });
      },
      enteredWorld() {
        set((state) => {
          state.world.isEnteredWorld = true;
          state.world.loadState = WorldLoadState.Entered;
          state.overlay.isOpen = false;
        });
      },
      leftWorld() {
        set((state) => {
          state.world.isEnteredWorld = false;
          state.world.worldId = undefined;
          state.world.loadState = WorldLoadState.None;
          state.worldChat.isOpen = false;
          state.overlay.isOpen = true;
          state.world.joiningWorld = false;
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
