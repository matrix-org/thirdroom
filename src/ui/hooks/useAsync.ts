import { Reducer, useEffect, useReducer, useMemo } from "react";

export type UseAsyncState<T> =
  | {
      loading: boolean;
      error?: Error;
      value?: T;
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

enum UseAsyncActionType {
  Load,
  Resolved,
  Rejected,
}

type UseAsyncAction<T> =
  | {
      type: string;
    }
  | {
      type: UseAsyncActionType.Load;
    }
  | {
      type: UseAsyncActionType.Resolved;
      value: T;
    }
  | {
      type: UseAsyncActionType.Rejected;
      error: Error;
    };

const initialState = {
  loading: true,
  error: undefined,
  value: undefined,
};

function asyncReducer<T>(state: UseAsyncState<T>, action: UseAsyncAction<T>): UseAsyncState<T> {
  switch (action.type) {
    case UseAsyncActionType.Load:
      return initialState;
    case UseAsyncActionType.Resolved:
      return {
        loading: false,
        error: undefined,
        value: action.value,
      };
    case UseAsyncActionType.Rejected:
      return {
        loading: false,
        error: action.error,
        value: undefined,
      };
    default:
      return state;
  }
}

export type PromiseReturningFunction<T> = (...args: any[]) => Promise<T>;

export type UseAsyncArg<T> = Promise<T> | PromiseReturningFunction<T>;

export function useAsync<T>(promise: PromiseReturningFunction<T>, deps: any[]): UseAsyncState<T>;
export function useAsync<T>(promise: Promise<T>): UseAsyncState<T>;
export function useAsync<T>(promise: UseAsyncArg<T>, deps?: any[]): UseAsyncState<T> {
  const [state, dispatch] = useReducer<Reducer<UseAsyncState<T>, UseAsyncAction<T>>>(asyncReducer, initialState);

  const promiseValue = useMemo(() => {
    if (typeof promise === "function") {
      return promise();
    } else {
      return promise;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promise || deps]);

  useEffect(() => {
    let canceled = false;

    dispatch({ type: UseAsyncActionType.Load });

    promiseValue
      .then((value) => {
        if (!canceled) {
          dispatch({ type: UseAsyncActionType.Resolved, value });
        }
      })
      .catch((error) => {
        if (!canceled) {
          dispatch({ type: UseAsyncActionType.Rejected, error });
        }
      });

    return () => {
      canceled = true;
    };
  }, [promiseValue]);

  return state;
}
