import React from "react";
import classNames from "classnames";
import "./Scroll.css";

interface IScroll {
  className?: string;
  direction?: "horizontal" | "vertical" | "both";
  visibility?: "visible" | "invisible" | "auto";
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
  forwardRef?: React.RefObject<HTMLDivElement>;
}

export function Scroll({
  className,
  direction = "vertical",
  visibility = "auto",
  onScroll,
  children,
  forwardRef,
}: IScroll) {
  const scrollClass = classNames(`Scroll Scroll--${direction} Scroll--${visibility}`, className);

  return (
    <div ref={forwardRef} className={scrollClass} onScroll={onScroll}>
      {children}
    </div>
  );
}
