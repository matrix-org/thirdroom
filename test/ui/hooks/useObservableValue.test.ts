import { describe, test, expect } from "vitest";
import { renderHook } from "@testing-library/react-hooks";
import { ObservableValue } from "hydrogen-view-sdk";

import { useObservableValue } from "../../../src/ui/hooks/useObservableValue";

describe("useObservableValue", () => {
  test("it should return undefined when passed an undefined value", () => {
    const { result } = renderHook(() => useObservableValue(undefined));

    expect(result.current).toBe(undefined);
  });

  test("it should return the first observed value", () => {
    const observable = new ObservableValue(1);

    const { result } = renderHook(() => useObservableValue(observable));

    expect(result.current).toBe(1);
    expect(observable.hasSubscriptions).toBe(true);
  });

  test("it should not rerender unless the value has changed", () => {
    const observable = new ObservableValue(1);

    const { result } = renderHook(() => useObservableValue(observable));

    expect(result.all.length).toBe(1);
  });

  test("it should change when the observed value changes", () => {
    const observable = new ObservableValue(1);

    const { result } = renderHook(() => useObservableValue(observable));

    expect(result.current).toBe(1);

    observable.set(2);

    expect(result.current).toBe(2);
  });

  test("it should change when the observable changes", () => {
    const observable1 = new ObservableValue(1);
    const observable2 = new ObservableValue(2);

    const { result, rerender } = renderHook(({ observable }) => useObservableValue(observable), {
      initialProps: { observable: observable1 },
    });

    expect(result.current).toBe(1);
    expect(observable1.hasSubscriptions).toBe(true);

    rerender({ observable: observable2 });

    expect(result.current).toBe(2);
    expect(observable1.hasSubscriptions).toBe(false);
    expect(observable2.hasSubscriptions).toBe(true);
  });

  test("it should handle an undefined to observable transition", () => {
    const observable = new ObservableValue(1);

    const { result, rerender } = renderHook<{ observable: ObservableValue<number> | undefined }, number | undefined>(
      ({ observable }) => useObservableValue(observable),
      {
        initialProps: { observable: undefined },
      }
    );

    expect(result.current).toBe(undefined);
    expect(observable.hasSubscriptions).toBe(false);

    rerender({ observable });

    expect(result.current).toBe(1);
    expect(observable.hasSubscriptions).toBe(true);
  });

  test("it should handle an observable to undefined transition", () => {
    const observable = new ObservableValue(1);

    const { result, rerender } = renderHook<{ observable: ObservableValue<number> | undefined }, number | undefined>(
      ({ observable }) => useObservableValue(observable),
      {
        initialProps: { observable },
      }
    );

    expect(result.current).toBe(1);
    expect(observable.hasSubscriptions).toBe(true);

    rerender({ observable: undefined });

    expect(result.current).toBe(undefined);
    expect(observable.hasSubscriptions).toBe(false);
  });
});
