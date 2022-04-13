import { BaseObservableMap } from "hydrogen-view-sdk";
import { useEffect, useState } from "react";

export function useObservableMap<K, V>(observable: BaseObservableMap<K, V>): Map<K, V> {
  const [state, setState] = useState<Map<K, V>>(() => new Map(observable));

  useEffect(() => {
    const mapObserver = {
      onReset() {
        setState(new Map(observable));
      },
      onAdd() {
        setState(new Map(observable));
      },
      onUpdate() {
        setState(new Map(observable));
      },
      onRemove() {
        setState(new Map(observable));
      },
    };

    observable.subscribe(mapObserver);

    return () => {
      observable.unsubscribe(mapObserver);
    };
  }, [observable]);

  return state;
}
