import { describe, test, expect } from "vitest";
import { renderHook } from "@testing-library/react-hooks";
import { ObservableValue } from "@thirdroom/hydrogen-view-sdk";

import { useAsyncObservableValue } from "../../../src/ui/hooks/useAsyncObservableValue";

describe("useAsyncObservableValue", () => {
  test("it should emit a loading state and then return the initial value once resolved", async () => {
    const observable = new ObservableValue(1);
    const observablePromise = Promise.resolve(observable);

    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncObservableValue(() => observablePromise, [observablePromise])
    );

    expect(result.current.value).toBe(undefined);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(undefined);
    expect(observable.hasSubscriptions).toBe(false);

    await waitForNextUpdate();

    expect(result.current.value).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(undefined);
    expect(observable.hasSubscriptions).toBe(true);
  });

  test("it should emit a loading state and then return an error when rejected", async () => {
    const error = new Error("rejected");
    const observablePromise = Promise.reject(error);

    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncObservableValue(() => observablePromise, [observablePromise])
    );

    expect(result.current.value).toBe(undefined);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(undefined);

    await waitForNextUpdate();

    expect(result.current.value).toBe(undefined);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
  });

  test("it should not emit the value for a first resolved promise if changed while in-flight", async () => {
    const observable1 = new ObservableValue(1);
    let resolvePromise1: () => void = () => {};

    const observablePromise1 = new Promise<ObservableValue<number>>((resolve) => {
      resolvePromise1 = () => resolve(observable1);
    });

    const observable2 = new ObservableValue(2);
    let resolvePromise2: () => void = () => {};
    const observablePromise2 = new Promise<ObservableValue<number>>((resolve) => {
      resolvePromise2 = () => resolve(observable2);
    });

    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ observablePromise }) => useAsyncObservableValue(() => observablePromise, [observablePromise]),
      {
        initialProps: { observablePromise: observablePromise1 },
      }
    );

    expect(result.current.value).toBe(undefined);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(undefined);
    expect(result.all.length).toBe(1);

    rerender({ observablePromise: observablePromise2 });

    expect(result.current.value).toBe(undefined);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(undefined);
    expect(result.all.length).toBe(2);

    resolvePromise1();
    resolvePromise2();

    await waitForNextUpdate();

    expect(result.current.value).toBe(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(undefined);
    expect(result.all.length).toBe(3);
    expect(observable1.hasSubscriptions).toBe(false);
    expect(observable2.hasSubscriptions).toBe(true);
  });
});
