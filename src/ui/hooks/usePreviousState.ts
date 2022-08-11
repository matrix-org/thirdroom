import { useEffect, useRef } from "react";

export function usePreviousState<T>(value: T) {
  const valueRef = useRef<T>();
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  return valueRef.current;
}
