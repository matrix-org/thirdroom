import { useState, useCallback, useEffect } from "react";

import { ComponentPropertyType, ComponentPropertyValue } from "../../engine/component/types";
import { EditorEventType } from "../../engine/editor/editor.common";
import { EditorScope, sendSetComponentPropertyMessage } from "../../engine/editor/editor.main";
import { getScope } from "../../engine/types/types.common";
import { useMainThreadContext } from "./useMainThread";

interface ComponentPropertyInputProps<T extends ComponentPropertyType> {
  value: ComponentPropertyValue<T> | undefined;
  onChange(value: ComponentPropertyValue<T>): void;
}

export function useComponentProperty<T extends ComponentPropertyType>(propId: number): ComponentPropertyInputProps<T> {
  const mainThread = useMainThreadContext();
  const editor = getScope(mainThread, EditorScope);
  const [value, setValue] = useState<ComponentPropertyValue<T> | undefined>(() =>
    editor.componentProperties.get(propId)
  );

  const onChange = useCallback(
    (value: ComponentPropertyValue<T>) => {
      sendSetComponentPropertyMessage(mainThread, propId, value);
      setValue(value);
    },
    [mainThread, propId]
  );

  useEffect(() => {
    function onComponentPropertyChanged(changedPropId: number, nextValue: ComponentPropertyValue<T>) {
      if (changedPropId === propId) {
        setValue(nextValue);
      }
    }

    editor.addListener(EditorEventType.ComponentPropertyChanged, onComponentPropertyChanged);

    setValue(editor.componentProperties.get(propId));

    return () => {
      editor.removeListener(EditorEventType.ComponentPropertyChanged, onComponentPropertyChanged);
    };
  }, [editor, propId]);

  return { value, onChange };
}
