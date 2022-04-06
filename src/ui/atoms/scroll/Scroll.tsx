import React from "react";
import "./Scroll.css";

interface IScroll {
  className?: string;
  direction?: "horizontal" | "vertical" | "both";
  visibility?: "visible" | "invisible" | "auto";
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
  forwardRef: React.RefObject<HTMLDivElement>;
}

export function Scroll({
  className,
  direction = "vertical",
  visibility = "auto",
  onScroll = undefined,
  children,
  forwardRef,
}: IScroll) {
  const classes = [`Scroll Scroll--${direction} Scroll--${visibility}`];
  if (className) classes.push(className);

  return (
    <div ref={forwardRef} className={classes.join(" ")} onScroll={onScroll}>
      {children}
    </div>
  );
}
