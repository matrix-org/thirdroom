import { useRef } from "react";

function didDependenciesChange(a?: readonly unknown[], b?: readonly unknown[]) {
  if (a === undefined || b === undefined) {
    return true;
  }

  if (a.length !== b.length) {
    return true;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return true;
    }
  }

  return false;
}

export default function useStableMemo<T>(factory: () => T, deps?: readonly unknown[]): T {
  const stateRef = useRef<{
    prevDeps?: readonly unknown[];
    value: T;
  }>();

  if (!stateRef.current || didDependenciesChange(deps, stateRef.current.prevDeps)) {
    stateRef.current = {
      prevDeps: deps,
      value: factory(),
    };
  }

  return stateRef.current.value;
}
