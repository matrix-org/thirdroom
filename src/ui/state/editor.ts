import { atom } from "jotai";

import { NOOP } from "../../engine/config.common";
import { MainNode, MainThreadResource } from "../../engine/resource/resource.main";

export enum EditorMode {
  SceneInspector = "scene_inspector",
  SceneEditor = "scene_editor",
  ScriptEditor = "script_editor",
}

export enum HierarchyTab {
  Scenes = "Scenes",
  Resources = "Resources",
}

export type ResourceOptions = { value: MainThreadResource; label: string }[];

export type ResourceMenu = {
  selected: MainThreadResource;
  options: ResourceOptions;
};
type ResourceMenuAction = {
  selected?: MainThreadResource;
  options?: ResourceOptions;
};

interface EditorState {
  activeEntityHistoryIndex: number;
  activeEntityHistorySize: number;
  activeEntity: number;
  selectedEntities: number[];
}

export const editorEnabledAtom = atom<boolean>(false);

export const editorModeAtom = atom<EditorMode>(EditorMode.SceneInspector);

export const hierarchyTabAtom = atom<HierarchyTab>(HierarchyTab.Scenes);

const baseResourceMenuAtom = atom<ResourceMenu>({
  selected: MainNode,
  options: [],
});
export const resourceMenuAtom = atom<ResourceMenu, [ResourceMenuAction], void>(
  (get) => get(baseResourceMenuAtom),
  (get, set, update) => {
    const menu = get(baseResourceMenuAtom);
    set(baseResourceMenuAtom, {
      selected: update.selected ?? menu.selected,
      options: update.options ?? menu.options,
    });
  }
);

type EditorStateAction =
  | {
      type: "SELECT";
      resourceId: number;
      isRef?: true;
    }
  | {
      type: "SELECT_BACKWARD";
    }
  | {
      type: "SELECT_FORWARD";
    }
  | {
      type: "RESET";
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
      newState.selectedEntities = [action.resourceId];

      let history = [...get(activeEntityHistoryAtom)];
      if (action.isRef) {
        if (editorState.activeEntityHistoryIndex < history.length - 1) {
          history = history.slice(0, editorState.activeEntityHistoryIndex + 1);
        }
        if (editorState.activeEntityHistorySize === 0) {
          history.push(editorState.activeEntity);
        }
        history.push(action.resourceId);

        newState.activeEntityHistoryIndex = history.length - 1;
        newState.activeEntityHistorySize = history.length;

        set(activeEntityHistoryAtom, history);
      } else if (history.length > 0) {
        newState.activeEntityHistoryIndex = -1;
        newState.activeEntityHistorySize = 0;
        set(activeEntityHistoryAtom, []);
      }

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
      newState.selectedEntities = [prevEntity];
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
      newState.selectedEntities = [nextEntity];
      set(baseEditorAtom, newState);
      return;
    }

    if (action.type === "RESET") {
      set(activeEntityHistoryAtom, []);
      set(baseEditorAtom, INITIAL_STATE);
      set(baseResourceMenuAtom, {
        selected: MainNode,
        options: [],
      });
    }
  }
);

export const DEFAULT_SCRIPT_SOURCE = `
world.onload = () => {
    
    

    world.onenter = () => {
        
    };
    
    world.onupdate = (dt, time) => {

    };

};
`;

export const scriptSourceAtom = atom<string>(DEFAULT_SCRIPT_SOURCE);
