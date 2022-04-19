import { describe, test, expect } from "vitest";
import { renderHook } from "@testing-library/react-hooks";
import { ObservableValue } from "@thirdroom/hydrogen-view-sdk";

import { useObservableValue } from "../../../src/ui/hooks/useObservableValue";

describe("useObservableValue", () => {
  test("it should return the first observed value", () => {
    const observable = new ObservableValue(1);

    const { result } = renderHook(() => useObservableValue(() => observable, [observable]));

    expect(result.current).toBe(1);
    expect(observable.hasSubscriptions).toBe(true);
  });

  test("it should not rerender unless the value has changed", () => {
    const observable = new ObservableValue(1);

    const { result } = renderHook(() => useObservableValue(() => observable, [observable]));

    expect(result.all.length).toBe(1);
  });

  test("it should change when the observed value changes", () => {
    const observable = new ObservableValue(1);

    const { result } = renderHook(() => useObservableValue(() => observable, [observable]));

    expect(result.current).toBe(1);

    observable.set(2);

    expect(result.current).toBe(2);
  });

  test("it should change when the observable changes", () => {
    const observable1 = new ObservableValue(1);
    const observable2 = new ObservableValue(2);

    const { result, rerender } = renderHook(({ observable }) => useObservableValue(() => observable, [observable]), {
      initialProps: { observable: observable1 },
    });

    expect(result.all.length).toBe(1);
    expect(result.current).toBe(1);
    expect(observable1.hasSubscriptions).toBe(true);

    rerender({ observable: observable2 });

    expect(result.all.length).toBe(2);
    expect(result.current).toBe(2);
    expect(observable1.hasSubscriptions).toBe(false);
    expect(observable2.hasSubscriptions).toBe(true);
  });
});
