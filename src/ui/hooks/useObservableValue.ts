import { BaseObservableValue } from "hydrogen-view-sdk";
import { useEffect, useReducer } from "react";

export function useObservableValue<T>(observable: BaseObservableValue<T>): T {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const valueObserver = () => {
      forceUpdate();
    };

    observable.subscribe(valueObserver);

    return () => {
      observable.unsubscribe(valueObserver);
    };
  }, [observable]);

  return observable.get();
}
