import { BaseObservableList, IListObserver } from "hydrogen-view-sdk";
import { useEffect, useReducer, useMemo } from "react";

export type ObservableListReturningFunction<T> = (...args: any[]) => BaseObservableList<T>;

export type UseObservableListArg<T> = BaseObservableList<T> | ObservableListReturningFunction<T>;

export function useObservableList<T>(observable: ObservableListReturningFunction<T>, deps: any[]): T[];
export function useObservableList<T>(observable: BaseObservableList<T>): T[];
export function useObservableList<T>(observable: UseObservableListArg<T>, deps?: any[]): T[] {
  const [updateCount, forceUpdate] = useReducer<(x: number) => number>((x) => x + 1, 0);

  const observableList = useMemo(() => {
    if (typeof observable === "function") {
      return observable();
    } else {
      return observable;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observable || deps]);

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

    observableList.subscribe(listObserver);

    return () => {
      observableList.unsubscribe(listObserver);
    };
  }, [observableList]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => Array.from(observableList), [observableList, updateCount]);

  return value;
}
