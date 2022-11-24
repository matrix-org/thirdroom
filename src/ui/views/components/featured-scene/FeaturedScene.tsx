import classNames from "classnames";
import { ReactNode } from "react";

import "./FeaturedScene.css";

interface FeaturedSceneProps {
  className?: string;
  thumbnail: ReactNode;
  children: ReactNode;
}
export function FeaturedScene({ className, thumbnail, children }: FeaturedSceneProps) {
  return (
    <div className={classNames("FeaturedScene flex flex-column gap-xs", className)}>
      {thumbnail}
      {children}
    </div>
  );
}

interface FeaturedSceneContentProps {
  className?: string;
  children: ReactNode;
}

export function FeaturedSceneContent({ className, children }: FeaturedSceneContentProps) {
  return <span className={classNames("FeaturedScene__Content flex gap-xs", className)}>{children}</span>;
}
