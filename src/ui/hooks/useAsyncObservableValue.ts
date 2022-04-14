import { useMemo } from "react";
import { BaseObservableValue, ObservableValue } from "hydrogen-view-sdk";

import { useObservableValue } from "./useObservableValue";
import { useAsync, UseAsyncPromise } from "./useAsync";

interface UseAsyncObservableReturn<T> {
  loading: boolean;
  error?: any;
  value?: T | undefined;
}

export function useAsyncObservableValue<T>(
  promise: UseAsyncPromise<BaseObservableValue<T>>,
  deps?: any[]
): UseAsyncObservableReturn<T> {
  const { loading, error, value: maybeObservable } = useAsync(promise, deps);
  const observable = useMemo(
    () => (maybeObservable ? maybeObservable : new ObservableValue(undefined)),
    [maybeObservable]
  );
  const value = useObservableValue(observable);
  return { loading, error, value };
}
