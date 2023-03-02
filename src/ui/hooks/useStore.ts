import create from "zustand";
import { immer } from "zustand/middleware/immer";

export interface UserProfileState {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  setUserId: (id: string) => void;
  setDisplayName: (name: string) => void;
  setAvatarUrl: (url?: string) => void;
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
