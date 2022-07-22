import { useState, useCallback } from "react";

import { ComponentPropertyType, ComponentPropertyValue } from "../../engine/component/types";

interface ComponentPropertyInputProps<T extends ComponentPropertyType> {
  value: ComponentPropertyValue<T> | undefined;
  onChange(value: ComponentPropertyValue<T>): void;
}

export function useComponentProperty<T extends ComponentPropertyType>(propId: number): ComponentPropertyInputProps<T> {
  const [value, setValue] = useState<ComponentPropertyValue<T> | undefined>();

  const onChange = useCallback((value: ComponentPropertyValue<T>) => {
    setValue(value);
  }, []);

  return { value, onChange };
}
