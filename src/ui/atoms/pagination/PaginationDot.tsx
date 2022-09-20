import classNames from "classnames";

import "./PaginationDot.css";

interface PaginationDotProps {
  className?: string;
  max: number;
  value: number;
}

export function PaginationDot({ className, max, value }: PaginationDotProps) {
  return (
    <div className={classNames("PaginationDot", className)}>
      {Array.from({ length: max }).map((item, index) => (
        <span
          key={index}
          className={classNames("PaginationDot__item", { "PaginationDot__item--active": index + 1 === value })}
        />
      ))}
    </div>
  );
}
