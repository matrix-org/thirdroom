import { RefObject, useCallback, useEffect, useState } from "react";
import { TreeViewRefApi } from "@thirdroom/manifold-editor-components";

import { IMainThreadContext } from "../../engine/MainThread";
import { useMainThreadContext } from "./useMainThread";
import { getModule } from "../../engine/module/module.common";
import {
  EditorModule,
  loadEditor,
  disposeEditor,
  EditorEventType,
  HierarchyChangedEvent,
  EditorLoadedEvent,
  SelectionChangedEvent,
  buildResourceList,
  setSelectedEntity,
} from "../../engine/editor/editor.main";
import { EditorNode } from "../../engine/editor/editor.common";
import { NOOP } from "../../engine/config.common";
import { ResourceModule, MainNode, getLocalResource } from "../../engine/resource/resource.main";
import { MainThreadResource } from "../../engine/resource/resource.main";
import kebabToPascalCase from "../../engine/utils/kebabToPascalCase";
import { LocalResourceInstance, ResourceDefinition } from "../../engine/resource/ResourceDefinition";

export enum HierarchyTab {
  Scenes = "Scenes",
  Resources = "Resources",
}

export type ResourceOptions = { value: MainThreadResource; label: string }[];
interface EditorUIState {
  loading: boolean;
  activeEntity: number;
  selectedEntities: number[];
  scene?: EditorNode;
  resources?: EditorNode;
  resourceOptions: ResourceOptions;
  hierarchyTab: HierarchyTab;
  resourceType: MainThreadResource;
  focusEid?: number;
}

type UseEditor = EditorUIState & {
  setHierarchyTab: (tab: HierarchyTab) => void;
  setResourceType: (type: MainThreadResource) => void;
  goToRef: (resourceId: number) => void;
};

export function useEditor(treeViewRef: RefObject<TreeViewRefApi>): UseEditor {
  const mainThread = useMainThreadContext();
  const editor = getModule(mainThread, EditorModule);
  const [state, setState] = useState<EditorUIState>({
    activeEntity: NOOP,
    loading: true,
    selectedEntities: [],
    focusEid: undefined,
    resourceOptions: [],
    resourceType: MainNode,
    hierarchyTab: HierarchyTab.Scenes,
  });

  const setHierarchyTab = useCallback((hierarchyTab: HierarchyTab) => {
    setState((prev) => ({
      ...prev,
      hierarchyTab,
    }));
  }, []);

  const setResourceType = useCallback(
    (resourceType: MainThreadResource) => {
      const resources = buildResourceList(mainThread, resourceType);

      setState((prev) => ({
        ...prev,
        resources,
        resourceType,
      }));
    },
    [mainThread]
  );

  const goToRef = useCallback(
    (resourceId: number) => {
      const resource = getLocalResource<LocalResourceInstance<ResourceDefinition, IMainThreadContext>>(
        mainThread,
        resourceId
      );

      if (!resource) {
        return;
      }

      const resourceType = resource.constructor;

      setSelectedEntity(mainThread, resourceId);
      setState((prev) => ({
        ...prev,
        hierarchyTab: HierarchyTab.Resources,
        resourceType,
        resources: buildResourceList(mainThread, resourceType),
      }));

      if (treeViewRef) {
        // TODO: Figure out why this doesn't seem to be scrolling to the node properly
        treeViewRef.current?.scrollToNode(resource.eid, "center");
      }
    },
    [mainThread, treeViewRef]
  );

  useEffect(() => {
    function onEditorLoaded({ activeEntity, selectedEntities }: EditorLoadedEvent) {
      const resourceModule = getModule(mainThread, ResourceModule);

      const resourceOptions = resourceModule.resourceConstructors.map((resourceConstructor) => ({
        value: resourceConstructor,
        label: kebabToPascalCase(resourceConstructor.resourceDef.name),
      }));
      const resourceType = resourceOptions[0]?.value ?? MainNode;
      const resources = buildResourceList(mainThread, resourceType);

      setState((state) => ({
        ...state,
        loading: false,
        activeEntity,
        selectedEntities,
        resourceOptions,
        resources,
        resourceType,
      }));
    }

    function onHierarchyChanged({ activeEntity, selectedEntities, scene }: HierarchyChangedEvent) {
      setState((state) => ({
        ...state,
        loading: false,
        activeEntity,
        selectedEntities,
        scene,
      }));
    }

    function onSelectionChanged({ activeEntity, selectedEntities }: SelectionChangedEvent) {
      setState((state) => ({
        ...state,
        loading: false,
        activeEntity,
        selectedEntities,
      }));
    }

    editor.eventEmitter.addListener(EditorEventType.EditorLoaded, onEditorLoaded);
    editor.eventEmitter.addListener(EditorEventType.HierarchyChanged, onHierarchyChanged);
    editor.eventEmitter.addListener(EditorEventType.SelectionChanged, onSelectionChanged);
    loadEditor(mainThread);

    return () => {
      disposeEditor(mainThread);
      editor.eventEmitter.removeListener(EditorEventType.EditorLoaded, onEditorLoaded);
      editor.eventEmitter.removeListener(EditorEventType.HierarchyChanged, onHierarchyChanged);
      editor.eventEmitter.removeListener(EditorEventType.SelectionChanged, onSelectionChanged);
    };
  }, [editor, mainThread]);

  return { ...state, setHierarchyTab, setResourceType, goToRef };
}
