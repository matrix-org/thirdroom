import { describe, test, expect } from "vitest";
import { renderHook } from "@testing-library/react-hooks";

import { useStableMemo } from "../../../src/ui/hooks/useStableMemo";

describe("useStableMemo", () => {
  test("it should only update when the deps array changes", () => {
    const { result, rerender } = renderHook(({ deps }) => useStableMemo(() => ({}), deps), {
      initialProps: { deps: [1] },
    });

    expect(result.all.length).toBe(1);

    rerender({ deps: [1] });

    expect(result.all.length).toBe(2);
    expect(result.all[0]).toBe(result.current);

    rerender({ deps: [2] });

    expect(result.all.length).toBe(3);
    expect(result.all[0]).not.toBe(result.current);
  });
});
