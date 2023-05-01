import { MouseEvent as RMouseEvent, ReactNode, useRef, useState } from "react";

import { Portal } from "../../../atoms/portal/Portal";
import HorizontalResizeIC from "../../../../../res/ic/horizontal-resize.svg";
import "./Scrubber.css";
import { Icon } from "../../../atoms/icon/Icon";
import { clamp } from "../../../utils/common";

interface ScrubberProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  children: ReactNode;
}

interface IScrubber {
  x: number;
  y: number;
}

export function Scrubber({ value, onChange, min, max, children }: ScrubberProps) {
  const scrubberRef = useRef<HTMLSpanElement>(null);
  const [scrubber, setScrubber] = useState<IScrubber>();
  const valueRef = useRef(value);

  function handleMouseDown(evt: RMouseEvent) {
    valueRef.current = value;
    evt.preventDefault();
    setScrubber({
      x: evt.clientX,
      y: evt.clientY,
    });
    scrubberRef.current?.requestPointerLock();

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(evt: MouseEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    const newValue = clamp(valueRef.current + evt.movementX, min, max);
    onChange(newValue);
    valueRef.current = newValue;

    setScrubber((scrubber) => {
      const { x, y } = scrubber ?? { x: 0, y: 0 };
      let mX = x + evt.movementX;
      let mY = y + evt.movementY;

      if (mX > window.innerWidth) mX -= window.innerWidth;
      else if (mX < 0) mX += window.innerWidth;
      if (mY > window.innerHeight) mY -= window.innerHeight;
      else if (mY < 0) mY += window.innerHeight;

      return { x: mX, y: mY };
    });
  }

  function handleMouseUp(evt: MouseEvent) {
    evt.preventDefault();
    setScrubber(undefined);
    document.exitPointerLock();

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }

  return (
    <span className="Scrubber" ref={scrubberRef} onMouseDown={handleMouseDown}>
      {children}
      {scrubber && (
        <Portal>
          <span
            className="Scrubber__cursor"
            style={{
              transform: `translate(calc(${scrubber.x}px - 50%), calc(${scrubber.y}px - 38%))`,
            }}
          >
            <Icon color="surface" src={HorizontalResizeIC} />
          </span>
        </Portal>
      )}
    </span>
  );
}
