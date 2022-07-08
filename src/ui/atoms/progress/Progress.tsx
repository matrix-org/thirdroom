import classNames from "classnames";
import * as RadixProgress from "@radix-ui/react-progress";

import "./Progress.css";

interface ProgressProps {
  className?: string;
  variant?: "primary" | "secondary" | "danger";
  value: number;
  max: number;
  getValueLabel?: (value: number, max: number) => string;
}

export function Progress({ className, variant = "primary", value, max, getValueLabel }: ProgressProps) {
  const getWidth = (max: number, value: number) => Math.round((value / max) * 100);

  return (
    <RadixProgress.Root
      className={classNames("Progress", `Progress--${variant}`, className)}
      value={value}
      max={max}
      getValueLabel={getValueLabel}
    >
      <RadixProgress.Indicator style={{ width: `${getWidth(max, value)}%` }} className="Progress__indicator" />
    </RadixProgress.Root>
  );
}
