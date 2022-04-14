import { BaseObservableMap, IMapObserver } from "hydrogen-view-sdk";
import { useEffect, useMemo, useReducer } from "react";

export function useObservableMap<K, V>(observable: BaseObservableMap<K, V>): Map<K, V> {
  const [updateCount, forceUpdate] = useReducer<(x: number) => number>((x) => x + 1, 0);

  useEffect(() => {
    const mapObserver: IMapObserver<K, V> = {
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
    };

    observable.subscribe(mapObserver);

    return () => {
      observable.unsubscribe(mapObserver);
    };
  }, [observable]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => new Map(observable), [observable, updateCount]);

  return value;
}
