import create from "zustand";
import produce from "immer";
import { RoomId } from "@thirdroom/hydrogen-view-sdk";

import { RoomListTabs } from "../views/session/sidebar/RoomListHeader";

export interface OverlayState {
  isOpen: boolean;
  selectedRoomListTab: RoomListTabs;
  activeChats: Set<RoomId>;
  selectedChatId: RoomId | undefined;
  selectedWorldId: RoomId | undefined;
}

export interface WorldState {
  isChatOpen: boolean;
  isPointerLock: boolean;
  selectedWorldId: RoomId | undefined;
  enteredWorldId: RoomId | undefined;
}

export interface StoreState {
  overlay: OverlayState;
  world: WorldState;
}

export const useStore = create<StoreState>(() => ({
  overlay: {
    isOpen: true,
    selectedRoomListTab: RoomListTabs.Home,
    activeChats: new Set(),
    selectedChatId: undefined,
    selectedWorldId: undefined,
  },
  world: {
    isChatOpen: false,
    isPointerLock: false,
    selectedWorldId: undefined,
    enteredWorldId: undefined,
  },
}));

export function openOverlay() {
  useStore.setState((state) =>
    produce(state, (draft) => {
      draft.overlay.isOpen = true;
    })
  );
}
export function closeOverlay() {
  useStore.setState((state) =>
    produce(state, (draft) => {
      draft.overlay.isOpen = false;
    })
  );
}

export function selectRoomListTab(tab: RoomListTabs) {
  useStore.setState((state) =>
    produce(state, (draft) => {
      draft.overlay.selectedRoomListTab = tab;
    })
  );
}

export function addActiveChat(roomId: RoomId) {
  useStore.setState((state) =>
    produce(state, (draft) => {
      draft.overlay.activeChats.add(roomId);
    })
  );
}
export function deleteActiveChat(roomId: RoomId) {
  useStore.setState((state) =>
    produce(state, (draft) => {
      draft.overlay.activeChats.delete(roomId);
    })
  );
}

export function selectChat(roomId: RoomId | undefined) {
  useStore.setState((state) =>
    produce(state, (draft) => {
      draft.overlay.selectedChatId = roomId;
    })
  );
}

export function selectWorld(roomId: RoomId | undefined) {
  useStore.setState((state) =>
    produce(state, (draft) => {
      draft.world.selectedWorldId = roomId;
    })
  );
}
export function enterWorld(roomId: RoomId | undefined) {
  useStore.setState((state) =>
    produce(state, (draft) => {
      draft.world.enteredWorldId = roomId;
    })
  );
}

export function openWorldChat() {
  useStore.setState((state) =>
    produce(state, (draft) => {
      draft.world.isChatOpen = true;
    })
  );
}
export function closeWorldChat() {
  useStore.setState((state) =>
    produce(state, (draft) => {
      draft.world.isChatOpen = false;
    })
  );
}
