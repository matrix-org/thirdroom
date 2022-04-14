import { BaseObservableList, IListObserver } from "hydrogen-view-sdk";
import { useEffect, useReducer, useMemo } from "react";

export function useObservableList<T>(observable: BaseObservableList<T>): T[] {
  const [updateCount, forceUpdate] = useReducer<(x: number) => number>((x) => x + 1, 0);

  useEffect(() => {
    const listObserver: IListObserver<T> = {
      onReset() {
        forceUpdate();
      },
      onAdd() {
        forceUpdate();
      },
      onUpdate() {
        forceUpdate();
      },
      onRemove() {
        forceUpdate();
      },
      onMove() {
        forceUpdate();
      },
    };

    observable.subscribe(listObserver);

    return () => {
      observable.unsubscribe(listObserver);
    };
  }, [observable]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => Array.from(observable), [observable, updateCount]);

  return value;
}
