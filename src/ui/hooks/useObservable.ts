import { BaseObservable } from "@thirdroom/hydrogen-view-sdk";
import { useEffect, useReducer, useRef, useMemo } from "react";

import { useIsMounted } from "./useIsMounted";

export function useObservable<O extends BaseObservable<H>, H, T>(
  observableFactory: () => O,
  createHandler: (update: (value: T) => void, observable: O) => H,
  getInitialValue: (observable: O) => T,
  deps: unknown[]
): T {
  const isMounted = useIsMounted();
  const [, forceUpdate] = useReducer((v) => v + 1, 0);
  const valueRef = useRef<T>();

  const subscriptionHandle = useMemo(() => {
    const update = (value: T) => {
      if (isMounted()) {
        valueRef.current = value;
        forceUpdate();
      }
    };

    const observable = observableFactory();

    const unsubscribe = observable.subscribe(createHandler(update, observable));

    valueRef.current = getInitialValue(observable);

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => subscriptionHandle, [subscriptionHandle]);

  return valueRef.current as T;
}
