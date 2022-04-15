import { useRef, useReducer, useCallback } from "react";

import { useIsMounted } from "./useIsMounted";

export type UseAsyncState<T> =
  | {
      loading: boolean;
      error?: Error | undefined;
      value?: T | undefined;
    }
  | {
      loading: true;
      error: undefined;
      value: undefined;
    }
  | {
      loading: false;
      error: Error;
      value: undefined;
    }
  | {
      loading: false;
      error: undefined;
      value: T;
    };

export function useAsync<T>(promiseFactory: () => Promise<T>, deps: unknown[]): UseAsyncState<T> {
  const isMounted = useIsMounted();
  const [, forceUpdate] = useReducer<(x: number) => number>((x) => x + 1, 0);
  const memoizedCallbackFnRef = useRef<() => Promise<T>>();
  const stateRef = useRef<UseAsyncState<T>>({
    loading: true,
    value: undefined,
    error: undefined,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedPromiseFactory = useCallback(promiseFactory, deps);

  if (memoizedPromiseFactory !== memoizedCallbackFnRef.current) {
    memoizedCallbackFnRef.current = memoizedPromiseFactory;

    stateRef.current = {
      loading: true,
      error: undefined,
      value: undefined,
    };

    memoizedPromiseFactory()
      .then((value) => {
        if (memoizedCallbackFnRef.current === memoizedPromiseFactory && isMounted()) {
          stateRef.current = {
            loading: false,
            error: undefined,
            value,
          };
          forceUpdate();
        }
      })
      .catch((error) => {
        if (memoizedCallbackFnRef.current === memoizedPromiseFactory && isMounted()) {
          stateRef.current = {
            loading: false,
            error,
            value: undefined,
          };
          forceUpdate();
        }
      });
  }

  return stateRef.current;
}
