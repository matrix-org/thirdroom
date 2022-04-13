import { BaseObservableValue } from "hydrogen-view-sdk";
import { useEffect, useState } from "react";

export function useObservableValue<T>(observable: BaseObservableValue<T>): T {
  const [state, setState] = useState<T>(() => observable.get());

  useEffect(() => {
    const valueObserver = (value: T) => {
      setState(value);
    };

    observable.subscribe(valueObserver);

    return () => {
      observable.unsubscribe(valueObserver);
    };
  }, [observable]);

  return state;
}
