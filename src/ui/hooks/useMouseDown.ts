import { useState } from "react";

import { useEvent } from "./useEvent";

export function useMouseDown(element: Element | Document | Window | null) {
  const [mouseDown, setMouseDown] = useState(false);

  useEvent(
    "mousedown",
    () => {
      setMouseDown(true);
    },
    element,
    []
  );

  useEvent(
    "mouseup",
    () => {
      setMouseDown(false);
    },
    element,
    []
  );

  return mouseDown;
}
