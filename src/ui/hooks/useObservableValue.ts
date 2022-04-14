import { BaseObservableValue } from "hydrogen-view-sdk";
import { useEffect, useReducer } from "react";

export function useObservableValue<T>(observable?: BaseObservableValue<T>): T | undefined {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const valueObserver = () => {
      forceUpdate();
    };

    if (observable) {
      observable.subscribe(valueObserver);
    }

    return () => {
      if (observable) {
        observable.unsubscribe(valueObserver);
      }
    };
  }, [observable]);

  return observable ? observable.get() : undefined;
}
