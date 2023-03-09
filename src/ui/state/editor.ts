import { atom } from "jotai";

import { NOOP } from "../../engine/config.common";
import { MainNode, MainThreadResource } from "../../engine/resource/resource.main";

export enum HierarchyTab {
  Scenes = "Scenes",
  Resources = "Resources",
}
export type ResourceOptions = { value: MainThreadResource; label: string }[];

export type ResourceMenu = {
  selected: MainThreadResource;
  options: ResourceOptions;
};

interface EditorState {
  activeEntityHistoryIndex: number;
  activeEntityHistorySize: number;
  activeEntity: number;
  selectedEntities: number[];
}

export const hierarchyTabAtom = atom<HierarchyTab>(HierarchyTab.Scenes);

export const resourceMenuAtom = atom<ResourceMenu>({
  selected: MainNode,
  options: [],
});

type EditorStateAction =
  | {
      type: "SELECT";
      resourceId: number;
    }
  | {
      type: "SELECT_BACKWARD";
    }
  | {
      type: "SELECT_FORWARD";
    };

const activeEntityHistoryAtom = atom<number[]>([]);

const INITIAL_STATE = {
  activeEntityHistoryIndex: -1,
  activeEntityHistorySize: 0,
  activeEntity: NOOP,
  selectedEntities: [],
};
const baseEditorAtom = atom<EditorState>(INITIAL_STATE);

export const editorAtom = atom<EditorState, [EditorStateAction], void>(
  (get) => get(baseEditorAtom),
  (get, set, action) => {
    if (action.type === "SELECT") {
      const editorState = get(baseEditorAtom);
      if (editorState.activeEntity === action.resourceId) return;

      const newState = { ...editorState };
      newState.activeEntity = action.resourceId;

      let history = [...get(activeEntityHistoryAtom)];
      if (editorState.activeEntityHistoryIndex < history.length - 1) {
        history = history.slice(0, editorState.activeEntityHistoryIndex + 1);
      }
      history.push(action.resourceId);

      newState.activeEntityHistoryIndex = history.length - 1;
      newState.activeEntityHistorySize = history.length;

      set(activeEntityHistoryAtom, history);
      set(baseEditorAtom, newState);
      return;
    }
    if (action.type === "SELECT_BACKWARD") {
      const editorState = get(baseEditorAtom);
      const newState = { ...editorState };
      const history = [...get(activeEntityHistoryAtom)];

      if (editorState.activeEntityHistoryIndex < 1) return;

      const prevEntity = history[editorState.activeEntityHistoryIndex - 1];
      newState.activeEntityHistoryIndex -= 1;
      newState.activeEntity = prevEntity;
      set(baseEditorAtom, newState);
      return;
    }

    if (action.type === "SELECT_FORWARD") {
      const editorState = get(baseEditorAtom);
      const newState = { ...editorState };
      const history = [...get(activeEntityHistoryAtom)];

      if (editorState.activeEntityHistoryIndex >= editorState.activeEntityHistorySize - 1) return;

      const nextEntity = history[editorState.activeEntityHistoryIndex + 1];
      newState.activeEntityHistoryIndex += 1;
      newState.activeEntity = nextEntity;
      set(baseEditorAtom, newState);
      return;
    }
  }
);
