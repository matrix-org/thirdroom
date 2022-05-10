import { useCallback, useEffect, DependencyList } from "react";

export function useEvent(
  type: keyof HTMLElementEventMap,
  callback: (e: Event) => void,
  element: Element | Document | Window | null,
  deps: DependencyList
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoCallback = useCallback(callback, deps);

  useEffect(() => {
    element?.addEventListener(type, memoCallback);
    return () => {
      element?.removeEventListener(type, memoCallback);
    };
  }, [element, type, memoCallback]);
}
