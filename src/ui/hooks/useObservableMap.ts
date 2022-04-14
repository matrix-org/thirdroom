import { BaseObservableMap, IMapObserver } from "hydrogen-view-sdk";
import { useEffect, useMemo, useReducer } from "react";

export type ObservableMapReturningFunction<K, V> = (...args: any[]) => BaseObservableMap<K, V>;

export type UseObservableMapArg<K, V> = BaseObservableMap<K, V> | ObservableMapReturningFunction<K, V>;

export function useObservableMap<K, V>(observable: ObservableMapReturningFunction<K, V>, deps: any[]): Map<K, V>;
export function useObservableMap<K, V>(observable: BaseObservableMap<K, V>): Map<K, V>;
export function useObservableMap<K, V>(observable: UseObservableMapArg<K, V>, deps?: any[]): Map<K, V> {
  const [updateCount, forceUpdate] = useReducer<(x: number) => number>((x) => x + 1, 0);

  const observableMap = useMemo(() => {
    if (typeof observable === "function") {
      return observable();
    } else {
      return observable;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observable || deps]);

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

    observableMap.subscribe(mapObserver);

    return () => {
      observableMap.unsubscribe(mapObserver);
    };
  }, [observableMap]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => new Map(observableMap), [observableMap, updateCount]);

  return value;
}
