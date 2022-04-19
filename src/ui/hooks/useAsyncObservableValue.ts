import { BaseObservableValue, ObservableValue } from "@thirdroom/hydrogen-view-sdk";

import { useObservableValue } from "./useObservableValue";
import { useAsync } from "./useAsync";

interface UseAsyncObservableReturn<T> {
  loading: boolean;
  error?: any;
  value?: T | undefined;
}

export function useAsyncObservableValue<T>(
  promiseFactory: () => Promise<BaseObservableValue<T>>,
  deps: unknown[]
): UseAsyncObservableReturn<T> {
  const { loading, error, value: observable } = useAsync(promiseFactory, deps);

  const value = useObservableValue(() => observable || new ObservableValue(undefined), [observable]);

  return { loading, error, value };
}
