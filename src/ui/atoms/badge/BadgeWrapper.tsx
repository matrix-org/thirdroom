import { ReactNode } from "react";
import classNames from "classnames";

import "./BadgeWrapper.css";

interface IBadgeWrapper {
  className?: string;
  badge?: ReactNode;
  children: ReactNode;
}

export function BadgeWrapper({ className, badge, children }: IBadgeWrapper) {
  if (!badge) return <>{children}</>;
  return (
    <div className={classNames("BadgeWrapper", className)}>
      {children}
      <div className="BadgeWrapper__item">{badge}</div>
    </div>
  );
}
