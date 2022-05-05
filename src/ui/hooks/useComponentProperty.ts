import { useState, useCallback, useEffect } from "react";

import { ComponentPropertyType, ComponentPropertyValue } from "../../engine/component/types";
import { EditorEventType } from "../../engine/editor/editor.common";
import { useEngine } from "./useEngine";

interface ComponentPropertyInputProps<T extends ComponentPropertyType> {
  value: ComponentPropertyValue<T> | undefined;
  onChange(value: ComponentPropertyValue<T>): void;
}

export function useComponentProperty<T extends ComponentPropertyType>(propId: number): ComponentPropertyInputProps<T> {
  const engine = useEngine();
  const [value, setValue] = useState(() => engine.getComponentProperty<T>(propId));

  const onChange = useCallback(
    (value: ComponentPropertyValue<T>) => {
      engine.setComponentProperty(propId, value);
      setValue(value);
    },
    [engine, propId]
  );

  useEffect(() => {
    function onComponentPropertyChanged(changedPropId: number, nextValue: ComponentPropertyValue<T>) {
      if (changedPropId === propId) {
        setValue(nextValue);
      }
    }

    engine.addListener(EditorEventType.ComponentPropertyChanged, onComponentPropertyChanged);

    setValue(engine.getComponentProperty(propId));

    return () => {
      engine.removeListener(EditorEventType.ComponentPropertyChanged, onComponentPropertyChanged);
    };
  }, [engine, propId]);

  return { value, onChange };
}
