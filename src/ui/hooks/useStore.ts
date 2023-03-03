import create from "zustand";
import { immer } from "zustand/middleware/immer";
export interface WorldState {
  worldId: string | undefined;
  entered: boolean;
  disposeNetworkInterface: (() => void) | undefined;
  setWorld(roomId: string): void;
  closeWorld(): void;
  setNetworkInterfaceDisposer(disposer: () => void): void;
}

export interface StoreState {
  world: WorldState;
}

export const useStore = create<StoreState>()(
  immer((set, get) => ({
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
