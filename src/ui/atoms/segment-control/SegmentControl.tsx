import { ReactNode } from "react";
import classNames from "classnames";

import "./SegmentControl.css";

interface SegmentControlProps {
  className?: string;
  children: ReactNode;
}

export function SegmentControl({ className, children }: SegmentControlProps) {
  return <div className={classNames("SegmentControl", className)}>{children}</div>;
}
