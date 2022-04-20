import { useEffect, useState } from "react";

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

const initialState = {
  loading: true,
  error: undefined,
  value: undefined,
};

export function useAsync<T>(promiseFactory: () => Promise<T>, deps: unknown[]): UseAsyncState<T> {
  const [state, setState] = useState<UseAsyncState<T>>(initialState);

  useEffect(() => {
    setState(initialState);

    let cancelled = false;

    promiseFactory()
      .then((value) => {
        if (!cancelled) {
          setState({
            loading: false,
            error: undefined,
            value,
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            loading: false,
            error,
            value: undefined,
          });
        }
      });

    return () => {
      cancelled = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
