import { BaseObservableList } from "@thirdroom/hydrogen-view-sdk";

import { useObservable } from "./useObservable";

export function useObservableList<T>(observableFactory: () => BaseObservableList<T>, deps: unknown[]): T[] {
  return useObservable(
    observableFactory,
    (update, observable) => ({
      onReset: () => update(Array.from(observable)),
      onAdd: () => update(Array.from(observable)),
      onUpdate: () => update(Array.from(observable)),
      onMove: () => update(Array.from(observable)),
      onRemove: () => update(Array.from(observable)),
    }),
    (observable) => Array.from(observable),
    deps
  );
}
