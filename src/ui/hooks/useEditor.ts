import { useEffect, useState } from "react";

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
} from "../../engine/editor/editor.main";
import { EditorNode } from "../../engine/editor/editor.common";
import { NOOP } from "../../engine/config.common";

interface EditorUIState {
  loading: boolean;
  activeEntity: number;
  selectedEntities: number[];
  scene?: EditorNode;
}

export function useEditor(): EditorUIState {
  const mainThread = useMainThreadContext();
  const editor = getModule(mainThread, EditorModule);
  const [state, setState] = useState<EditorUIState>({
    activeEntity: NOOP,
    loading: true,
    selectedEntities: [],
  });

  useEffect(() => {
    function onEditorLoaded({ activeEntity, selectedEntities }: EditorLoadedEvent) {
      setState((state) => ({
        ...state,
        loading: false,
        activeEntity,
        selectedEntities,
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

  return state;
}
