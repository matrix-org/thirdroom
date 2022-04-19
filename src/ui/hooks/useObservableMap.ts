import { BaseObservableMap } from "@thirdroom/hydrogen-view-sdk";

import { useObservable } from "./useObservable";

export function useObservableMap<K, V>(observableFactory: () => BaseObservableMap<K, V>, deps: unknown[]): Map<K, V> {
  return useObservable(
    observableFactory,
    (update, observable) => ({
      onReset: () => update(new Map(observable)),
      onAdd: () => update(new Map(observable)),
      onUpdate: () => update(new Map(observable)),
      onRemove: () => update(new Map(observable)),
    }),
    (observable) => new Map(observable),
    deps
  );
}
