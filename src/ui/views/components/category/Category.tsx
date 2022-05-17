import { ReactNode } from "react";

import "./Category.css";

interface CategoryProps {
  header: ReactNode;
  children: ReactNode;
}

export function Category({ header, children }: CategoryProps) {
  return (
    <div className="Category">
      {header}
      {children}
    </div>
  );
}
