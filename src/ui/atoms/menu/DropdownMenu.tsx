import { ReactNode } from "react";
import classNames from "classnames";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";

import "./DropdownMenu.css";

interface DropdownMenuProps {
  className?: string;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  portalled?: boolean;
  children: ReactNode;
}

export function DropdownMenu({
  className,
  content,
  side,
  align,
  defaultOpen,
  open,
  onOpenChange,
  portalled,
  children,
}: DropdownMenuProps) {
  return (
    <RadixDropdownMenu.Root defaultOpen={defaultOpen} open={open} onOpenChange={onOpenChange}>
      <RadixDropdownMenu.Trigger className="DropdownMenu__trigger" asChild>
        <span>{children}</span>
      </RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Content
        className={classNames("DropdownMenu", className)}
        sideOffset={8}
        side={side}
        align={align}
        portalled={portalled}
      >
        {content}
      </RadixDropdownMenu.Content>
    </RadixDropdownMenu.Root>
  );
}
