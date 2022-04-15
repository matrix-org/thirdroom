import { SubscriptionHandle, BaseObservable } from "hydrogen-view-sdk";
import { useCallback, useEffect, useReducer, useRef } from "react";

/**
 * @param observableFactory A callback function which returns a new observable.
 * @param deps Calls observableFactory, unsubscribes from previous observable,
 * and subscribes to new observable when changed.
 */
export function useObservable<O extends BaseObservable<H>, H, T>(
  observableFactory: () => O,
  createHandler: (update: (value: T) => void, observable: O) => H,
  getInitialValue: (observable: O) => T,
  deps: unknown[]
): T {
  const [, forceUpdate] = useReducer<(x: number) => number>((x) => x + 1, 0);
  const subscriptionHandleRef = useRef<SubscriptionHandle>();
  const memoizedCallbackFnRef = useRef<() => O>();
  const valueRef = useRef<T>();

  // Memoize observableFactory using the passed in deps. When the deps change,
  // the memoizedObservableFactory changes and we jump into the conditional below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedObservableFactory = useCallback(observableFactory, deps);

  // We need to unsubscribe from the observable using the subscriptionHandle when we unmount
  useEffect(() => subscriptionHandleRef.current, []);

  const updateValue = useCallback((value: T) => {
    valueRef.current = value;

    // Setting the valueRef wont cause a re-render so we force one.
    forceUpdate();
  }, []);

  if (memoizedObservableFactory !== memoizedCallbackFnRef.current) {
    memoizedCallbackFnRef.current = memoizedObservableFactory;

    const observable = memoizedObservableFactory();

    if (subscriptionHandleRef.current) {
      subscriptionHandleRef.current();
    }

    subscriptionHandleRef.current = observable.subscribe(createHandler(updateValue, observable));

    // Subscribe doesn't return the first value so set it here.
    // We don't need to call forceUpdate because we're already rerendering.
    valueRef.current = getInitialValue(observable);
  }

  return valueRef.current as T;
}
