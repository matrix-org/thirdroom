import { atom } from "jotai";

import { activeChatsAtom, openedChatAtom } from "./overlayChat";

const baseOverlayWorldAtom = atom<string | undefined>(undefined);

export const overlayWorldAtom = atom<string | undefined, [string | undefined], void>(
  (get) => get(baseOverlayWorldAtom),
  (get, set, value) => {
    set(baseOverlayWorldAtom, value);

    const openedChatId = get(openedChatAtom);
    if (openedChatId) {
      set(activeChatsAtom, {
        type: "MINIMIZE",
        roomId: openedChatId,
      });
    }
  }
);
