import { ReactNode } from "react";
import classNames from "classnames";

import "./ScenePreview.css";

interface ScenePreviewProps {
  className?: string;
  src?: string;
  alt?: string;
  fallback?: ReactNode;
}

export function ScenePreview({ className, src, alt, fallback }: ScenePreviewProps) {
  return (
    <div className={classNames("ScenePreview flex justify-center items-center", className)}>
      {src ? <img src={src} alt={alt} /> : fallback}
    </div>
  );
}
