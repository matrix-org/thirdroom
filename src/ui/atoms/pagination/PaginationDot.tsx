import classNames from "classnames";
import { ButtonHTMLAttributes, forwardRef } from "react";

import "./PaginationDot.css";

type PaginationDotProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  active?: boolean;
};

export const PaginationDot = forwardRef<HTMLButtonElement, PaginationDotProps>(
  ({ type, className, active, ...props }: PaginationDotProps, ref) => (
    <button
      type={type ?? "button"}
      className={classNames("PaginationDot", { "PaginationDot--active": active })}
      {...props}
      ref={ref}
    />
  )
);
