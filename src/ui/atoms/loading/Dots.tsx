import classNames from "classnames";

import { textColor } from "../text/Text";

import "./Dots.css";
interface DotsProps {
  className?: string;
  color?: textColor;
  size?: "sm" | "md" | "lg";
  paused?: boolean;
}

export function Dots({ className, color = "surface", size = "md", paused = false }: DotsProps) {
  return (
    <div className={classNames("Dots", `Dots--${color}`, `Dots--${size}`, { "Dots--paused": paused }, className)}>
      <span />
    </div>
  );
}
