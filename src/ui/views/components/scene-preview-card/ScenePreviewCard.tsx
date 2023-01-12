import classNames from "classnames";
import { ReactNode } from "react";

import "./ScenePreviewCard.css";

interface ScenePreviewCardProps {
  className?: string;
  thumbnail: ReactNode;
  children: ReactNode;
}
export function ScenePreviewCard({ className, thumbnail, children }: ScenePreviewCardProps) {
  return (
    <div className={classNames("ScenePreviewCard flex flex-column gap-xs", className)}>
      {thumbnail}
      {children}
    </div>
  );
}

interface ScenePreviewCardContentProps {
  className?: string;
  children: ReactNode;
}

export function ScenePreviewCardContent({ className, children }: ScenePreviewCardContentProps) {
  return <span className={classNames("ScenePreviewCard__Content flex gap-xs", className)}>{children}</span>;
}
