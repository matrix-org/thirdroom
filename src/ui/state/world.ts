import { atom } from "jotai";

interface WorldState {
  worldId: string | undefined;
  entered: boolean;
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
});

export const worldAtom = atom<WorldState, [WorldAction], void>(
  (get) => get(baseWorldAtom),
  (get, set, action) => {
    if (action.type === "LOAD") {
      set(baseWorldAtom, {
        worldId: action.roomId,
        entered: false,
      });
      return;
    }
    if (action.type === "ENTER") {
      set(baseWorldAtom, {
        worldId: get(baseWorldAtom).worldId,
        entered: true,
      });
      return;
    }
    if (action.type === "CLOSE") {
      set(baseWorldAtom, {
        worldId: undefined,
        entered: false,
      });
    }
  }
);
