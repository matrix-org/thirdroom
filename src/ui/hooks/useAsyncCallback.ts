import { useCallback, useState } from "react";

export type UseAsyncCallbackState<T> =
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

export type UseAsyncCallbackReturn<C extends (...args: unknown[]) => Promise<T>, T> = UseAsyncCallbackState<T> & {
  callback: (...args: Parameters<C>) => Promise<T | undefined>;
};

export function useAsyncCallback<C extends (...args: any[]) => Promise<T>, T>(
  callback: C,
  deps: unknown[]
): UseAsyncCallbackReturn<C, T> {
  const [state, setState] = useState<UseAsyncCallbackState<T>>({
    loading: false,
    error: undefined,
    value: undefined,
  });

  const onCallback = useCallback(async (...args: Parameters<C>) => {
    setState({
      loading: true,
      error: undefined,
      value: undefined,
    });

    let value: T | undefined;

    try {
      value = await callback(...args);

      setState({
        loading: false,
        error: undefined,
        value,
      });
    } catch (error: any) {
      setState({
        loading: false,
        error,
        value: undefined,
      });
    }

    return value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    callback: onCallback,
    ...state,
  };
}
