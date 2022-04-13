import { BaseObservableList } from "hydrogen-view-sdk";
import { useEffect, useState } from "react";

export function useObservableList<T>(observable: BaseObservableList<T>): T[] {
  const [state, setState] = useState<T[]>([]);

  useEffect(() => {
    const listObserver = {
      onReset() {
        setState(Array.from(observable));
      },
      onAdd() {
        setState(Array.from(observable));
      },
      onUpdate() {
        setState(Array.from(observable));
      },
      onRemove() {
        setState(Array.from(observable));
      },
      onMove() {},
    };

    observable.subscribe(listObserver);

    setState(Array.from(observable));

    return () => {
      observable.unsubscribe(listObserver);
    };
  }, [observable]);

  return state;
}
