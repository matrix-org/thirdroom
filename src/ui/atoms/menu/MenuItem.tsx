import { AllHTMLAttributes, forwardRef, ReactNode } from "react";
import classNames from "classnames";

import { Text } from "../text/Text";
import "./MenuItem.css";
interface MenuItemProps {
  className?: string;
  variant?: "surface" | "primary" | "secondary" | "danger";
  children: ReactNode;
}

export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps & AllHTMLAttributes<HTMLDivElement>>(
  ({ className, variant = "surface", children, ...props }, ref) => {
    return (
      <div className={classNames("MenuItem", `MenuItem--${variant}`, className)} ref={ref} {...props}>
        {typeof children === "string" ? (
          <Text className="truncate" variant="b2" color={variant} weight="medium">
            {children}
          </Text>
        ) : (
          children
        )}
      </div>
    );
  }
);
