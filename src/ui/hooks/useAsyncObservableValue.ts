import { useEffect, useRef, useState } from "react";
import { BaseObservableValue } from "hydrogen-view-sdk";

import { useObservableValue } from "./useObservableValue";

interface UseAsyncObservableValueState<T> {
  loading: boolean;
  error?: any;
  observable?: BaseObservableValue<T>;
}

interface AsyncObservableValue<T> {
  loading: boolean;
  error?: any;
  value?: T;
}

export function useAsyncObservableValue<T>(promise?: Promise<BaseObservableValue<T>>): AsyncObservableValue<T> {
  const initialRenderRef = useRef<boolean>(true); // Prevent double render for initial value
  const curPromiseRef = useRef<Promise<BaseObservableValue<T>> | undefined>(promise);

  const [{ loading, error, observable }, setState] = useState<UseAsyncObservableValueState<T>>({
    loading: promise ? true : false,
  });

  useEffect(() => {
    curPromiseRef.current = promise;

    if (initialRenderRef.current) {
      initialRenderRef.current = false;
    } else {
      setState({ loading: promise ? true : false });
    }

    if (promise) {
      promise
        .then((observable) => {
          if (curPromiseRef.current === promise) {
            setState({ loading: false, observable });
          }
        })
        .catch((error) => {
          if (curPromiseRef.current === promise) {
            setState({ loading: false, error });
          }
        });
    }
  }, [promise]);

  const value = useObservableValue(observable);

  return {
    loading,
    error,
    value,
  };
}
