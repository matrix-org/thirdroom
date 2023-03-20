import { atom } from "jotai";

import { editorAtom } from "./editor";

interface WorldState {
  worldId: string | undefined;
  entered: boolean;
  loading: boolean;
}

type WorldAction =
  | {
      type: "LOAD";
      roomId: string;
    }
  | {
      type: "ENTER";
    }
  | {
      type: "CLOSE";
    };

const baseWorldAtom = atom<WorldState>({
  worldId: undefined,
  entered: false,
  loading: false,
});

export const worldAtom = atom<WorldState, [WorldAction], void>(
  (get) => get(baseWorldAtom),
  (get, set, action) => {
    if (action.type === "LOAD") {
      set(baseWorldAtom, {
        worldId: action.roomId,
        entered: false,
        loading: true,
      });
      return;
    }
    if (action.type === "ENTER") {
      set(baseWorldAtom, {
        worldId: get(baseWorldAtom).worldId,
        entered: true,
        loading: false,
      });
      return;
    }
    if (action.type === "CLOSE") {
      set(baseWorldAtom, {
        worldId: undefined,
        entered: false,
        loading: false,
      });
      set(editorAtom, { type: "RESET" });
    }
  }
);
