import { describe, test, expect } from "vitest";
import { renderHook } from "@testing-library/react-hooks";
import { ObservableArray } from "@thirdroom/hydrogen-view-sdk";

import { useObservableList } from "../../../src/ui/hooks/useObservableList";

describe("useObservableList", () => {
  test("it should return a new array when changed", () => {
    const observable = new ObservableArray([1]);

    const { result } = renderHook(() => useObservableList(() => observable, [observable]));

    observable.update(0, 2);

    expect(result.all.length).toBe(2);
    expect(result.all[0]).not.toBe(result.all[1]);
  });

  test("it should return the first observed value", () => {
    const observable = new ObservableArray([1]);

    const { result } = renderHook(() => useObservableList(() => observable, [observable]));

    expect(result.current).toStrictEqual([1]);
    expect(observable.hasSubscriptions).toBe(true);
    expect(result.all.length).toBe(1);
  });

  test("it should change when the an item is appended", () => {
    const observable = new ObservableArray([1, 2, 3]);

    const { result } = renderHook(() => useObservableList(() => observable, [observable]));

    expect(result.current).toStrictEqual([1, 2, 3]);

    observable.append(4);

    expect(result.current).toStrictEqual([1, 2, 3, 4]);
    expect(result.all.length).toBe(2);
  });

  test("it should change when the an item is updated", () => {
    const observable = new ObservableArray([1, 2, 3]);

    const { result } = renderHook(() => useObservableList(() => observable, [observable]));

    expect(result.current).toStrictEqual([1, 2, 3]);

    observable.update(0, 4);

    expect(result.current).toStrictEqual([4, 2, 3]);
    expect(result.all.length).toBe(2);
  });

  test("it should change when the an item is removed", () => {
    const observable = new ObservableArray([1, 2, 3]);

    const { result } = renderHook(() => useObservableList(() => observable, [observable]));

    expect(result.current).toStrictEqual([1, 2, 3]);

    observable.remove(0);

    expect(result.current).toStrictEqual([2, 3]);
    expect(result.all.length).toBe(2);
  });

  test("it should change when the an item is moved", () => {
    const observable = new ObservableArray([1, 2, 3]);

    const { result } = renderHook(() => useObservableList(() => observable, [observable]));

    expect(result.current).toStrictEqual([1, 2, 3]);

    observable.move(0, 1);

    expect(result.current).toStrictEqual([2, 1, 3]);
    expect(result.all.length).toBe(2);
  });

  test("it should change when the observable changes", () => {
    const observable1 = new ObservableArray([1]);
    const observable2 = new ObservableArray([2]);

    const { result, rerender } = renderHook(({ observable }) => useObservableList(() => observable, [observable]), {
      initialProps: { observable: observable1 },
    });

    expect(result.current).toStrictEqual([1]);
    expect(observable1.hasSubscriptions).toBe(true);

    rerender({ observable: observable2 });

    expect(result.current).toStrictEqual([2]);
    expect(observable1.hasSubscriptions).toBe(false);
    expect(observable2.hasSubscriptions).toBe(true);
    expect(result.all.length).toBe(2);
  });
});
