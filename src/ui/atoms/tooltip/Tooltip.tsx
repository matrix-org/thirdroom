import { ReactNode } from "react";
import classNames from "classnames";
import * as RadixTooltip from "@radix-ui/react-tooltip";

import { Text } from "../text/Text";

import "./Tooltip.css";

interface ITooltip {
  className?: string;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  portalled?: boolean;
  children: ReactNode;
}

export function Tooltip({
  className,
  content,
  side = "bottom",
  align = "center",
  delayDuration = 400,
  defaultOpen,
  open,
  onOpenChange,
  portalled = true,
  children,
}: ITooltip) {
  const tooltipClass = classNames("Tooltip", className);

  return (
    <RadixTooltip.Provider delayDuration={400}>
      <RadixTooltip.Root
        delayDuration={delayDuration}
        defaultOpen={defaultOpen}
        open={open}
        onOpenChange={onOpenChange}
      >
        <RadixTooltip.Trigger className="Tooltip__trigger" asChild>
          <span>{children}</span>
        </RadixTooltip.Trigger>
        <RadixTooltip.TooltipContent
          className={tooltipClass}
          sideOffset={8}
          side={side}
          align={align}
          portalled={portalled}
        >
          {typeof content === "string" ? (
            <Text variant="b2" color="tooltip" weight="medium">
              {content}
            </Text>
          ) : (
            content
          )}
          <RadixTooltip.Arrow className="Tooltip__arrow" height={5} width={10} offset={8} />
        </RadixTooltip.TooltipContent>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
