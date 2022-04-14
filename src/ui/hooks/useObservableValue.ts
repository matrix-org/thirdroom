import { BaseObservableValue } from "hydrogen-view-sdk";
import { useEffect, useMemo, useReducer } from "react";

export type ObservableValueReturningFunction<T> = (...args: any[]) => BaseObservableValue<T>;

export type UseObservableValueArg<T> = BaseObservableValue<T> | ObservableValueReturningFunction<T>;

export function useObservableValue<T>(observable: ObservableValueReturningFunction<T>, deps: any[]): T;
export function useObservableValue<T>(observable: BaseObservableValue<T>): T;
export function useObservableValue<T>(observable: UseObservableValueArg<T>, deps?: any[]): T {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const observableValue = useMemo(() => {
    if (typeof observable === "function") {
      return observable();
    } else {
      return observable;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observable || deps]);

  useEffect(() => {
    const valueObserver = () => {
      forceUpdate();
    };

    observableValue.subscribe(valueObserver);

    return () => {
      observableValue.unsubscribe(valueObserver);
    };
  }, [observableValue]);

  return observableValue.get();
}
