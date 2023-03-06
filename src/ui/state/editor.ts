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
  activeEntity: number;
  selectedEntities: number[];
}

export const hierarchyTabAtom = atom<HierarchyTab>(HierarchyTab.Scenes);

export const resourceMenuAtom = atom<ResourceMenu>({
  selected: MainNode,
  options: [],
});

export const editorAtom = atom<EditorState>({
  activeEntity: NOOP,
  selectedEntities: [],
});
