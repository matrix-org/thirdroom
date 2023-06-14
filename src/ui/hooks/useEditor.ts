import { RefObject, useEffect, useState } from "react";
import { TreeViewRefApi } from "@thirdroom/manifold-editor-components";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

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
import { ResourceModule, MainNode, getLocalResource } from "../../engine/resource/resource.main";
import kebabToPascalCase from "../../engine/utils/kebabToPascalCase";
import { editorAtom, HierarchyTab, hierarchyTabAtom, resourceMenuAtom } from "../state/editor";
import { LocalResourceInstance, ResourceDefinition } from "../../engine/resource/ResourceDefinition";
import { MainContext } from "../../engine/MainThread";
interface EditorUIState {
  loading: boolean;
  scene?: EditorNode;
  resources?: EditorNode;
}

export function useEditor(treeViewRef: RefObject<TreeViewRefApi>): EditorUIState {
  const mainThread = useMainThreadContext();
  const editor = getModule(mainThread, EditorModule);
  const [state, setState] = useState<EditorUIState>({
    loading: false,
    scene: undefined,
    resources: undefined,
  });

  const setHierarchyTab = useSetAtom(hierarchyTabAtom);
  const setResourceMenu = useSetAtom(resourceMenuAtom);
  const selectedResourceType = useAtomValue(resourceMenuAtom).selected;
  const [editorState, setEditorState] = useAtom(editorAtom);

  useEffect(() => {
    const resources = buildResourceList(mainThread, selectedResourceType);

    setState((state) => ({
      ...state,
      resources,
    }));
  }, [selectedResourceType, mainThread]);

  useEffect(() => {
    const resourceId = editorState.activeEntity;
    if (editorState.activeEntityHistorySize === 0 && resourceId) {
      setSelectedEntity(mainThread, resourceId);
    } else if (resourceId) {
      const resourceId = editorState.activeEntity;
      const resource = getLocalResource<LocalResourceInstance<ResourceDefinition, MainContext>>(mainThread, resourceId);

      if (!resource) {
        return;
      }

      const resourceType = resource.constructor;

      setSelectedEntity(mainThread, resourceId);
      setHierarchyTab(HierarchyTab.Resources);
      setResourceMenu({ selected: resourceType });
      setState((prev) => ({
        ...prev,
        resources: buildResourceList(mainThread, resourceType),
      }));

      if (treeViewRef) {
        setTimeout(() => {
          treeViewRef.current?.scrollToNode(resource.eid, "center");
        });
      }
    }
  }, [
    mainThread,
    editorState.activeEntity,
    editorState.activeEntityHistorySize,
    treeViewRef,
    setResourceMenu,
    setHierarchyTab,
  ]);

  useEffect(() => {
    function onEditorLoaded({ activeEntity, selectedEntities }: EditorLoadedEvent) {
      const resourceModule = getModule(mainThread, ResourceModule);

      const resourceOptions = resourceModule.resourceConstructors.map((resourceConstructor) => ({
        value: resourceConstructor,
        label: kebabToPascalCase(resourceConstructor.resourceDef.name),
      }));
      const resourceType = resourceOptions[0]?.value ?? MainNode;

      setResourceMenu({
        selected: resourceType,
        options: resourceOptions,
      });
      setState((state) => ({
        ...state,
        loading: false,
        resources: buildResourceList(mainThread, resourceType),
      }));
    }

    function onHierarchyChanged({ activeEntity, selectedEntities, scene }: HierarchyChangedEvent) {
      setState((state) => ({
        ...state,
        scene,
      }));
    }

    function onSelectionChanged({ activeEntity, selectedEntities }: SelectionChangedEvent) {
      setEditorState({
        type: "SELECT",
        resourceId: activeEntity,
      });
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
  }, [editor, mainThread, setResourceMenu, setEditorState]);

  return { ...state };
}
