import { useState, useCallback } from "react";

import { ComponentInfo } from "../../engine/component/types";

export function useComponent(componentId: number): (ComponentInfo & { removeComponent(): void }) | undefined {
  const [componentInfo] = useState<ComponentInfo | undefined>();

  const removeComponent = useCallback(() => {}, []);

  if (!componentInfo) {
    return;
  }

  return { ...componentInfo, removeComponent };
}
