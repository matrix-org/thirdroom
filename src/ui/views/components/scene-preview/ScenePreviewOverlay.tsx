import { ReactNode } from "react";
import classNames from "classnames";

import "./ScenePreviewOverlay.css";

interface ScenePreviewOverlayProps {
  className?: string;
  overlay?: ReactNode;
  children: ReactNode;
}

export function ScenePreviewOverlay({ className, overlay, children }: ScenePreviewOverlayProps) {
  return (
    <div className={classNames("ScenePreviewOverlay", className)}>
      {children}
      {overlay && <div className="ScenePreviewOverlay__overlay flex flex-column">{overlay}</div>}
    </div>
  );
}
