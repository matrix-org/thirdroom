import { Reducer, useEffect, useReducer } from "react";

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

export type AsyncFunction<T> = (...args: any[]) => Promise<T>;

export type UseAsyncPromise<T> = Promise<T> | AsyncFunction<T>;

export function useAsync<T>(promise: UseAsyncPromise<T>, deps?: any[]): UseAsyncState<T> {
  const [state, dispatch] = useReducer<Reducer<UseAsyncState<T>, UseAsyncAction<T>>>(asyncReducer, initialState);

  useEffect(() => {
    let canceled = false;
    let promiseValue: Promise<T>;

    if (typeof promise === "function") {
      promiseValue = promise();
    } else {
      promiseValue = promise;
    }

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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps || [promise]);

  return state;
}
