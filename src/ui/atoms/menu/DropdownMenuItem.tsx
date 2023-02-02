import { ReactNode } from "react";
import classNames from "classnames";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";

import { Text } from "../text/Text";
import "./MenuItem.css";
interface DropdownMenuItemProps {
  className?: string;
  variant?: "surface" | "primary" | "secondary" | "danger";
  onSelect?: (evt: Event) => void;
  disabled?: boolean;
  children: ReactNode;
}

export function DropdownMenuItem({
  className,
  variant = "surface",
  onSelect,
  disabled,
  children,
}: DropdownMenuItemProps) {
  return (
    <RadixDropdownMenu.Item
      onSelect={onSelect}
      className={classNames("MenuItem", `MenuItem--${variant}`, className)}
      disabled={disabled}
    >
      {typeof children === "string" ? (
        <Text variant="b2" color={variant} weight="medium">
          {children}
        </Text>
      ) : (
        children
      )}
    </RadixDropdownMenu.Item>
  );
}
