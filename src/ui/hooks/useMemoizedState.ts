import { useCallback, useState } from "react";

import { shallowObjectsEqual } from "../../engine/utils/shallowObjectsEqual";

export function useMemoizedState<T extends {} | undefined>(initialState?: T | (() => T)): [T, (next: T) => void] {
  const [state, _setState] = useState<T>(initialState as any);
  const setState = useCallback(
    (next: T) => {
      _setState((prev) => {
        if (!next || !prev) {
          return next;
        }

        if (shallowObjectsEqual(prev, next)) {
          return prev;
        }

        return next;
      });
    },
    [_setState]
  );

  return [state, setState];
}
