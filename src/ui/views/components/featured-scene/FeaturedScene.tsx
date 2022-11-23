import classNames from "classnames";
import { ReactNode } from "react";

import "./FeaturedScene.css";

interface FeaturedSceneProps {
  className?: string;
  thumbnail: ReactNode;
  options: ReactNode;
  children: ReactNode;
}
export function FeaturedScene({ className, thumbnail, options, children }: FeaturedSceneProps) {
  return (
    <div className={classNames("FeaturedScene flex flex-column gap-xs", className)}>
      {thumbnail}
      <div className="flex items-start gap-xxs">
        {children}
        {options}
      </div>
    </div>
  );
}

interface FeaturedSceneContentProps {
  children: ReactNode;
}

export function FeaturedSceneContent({ children }: FeaturedSceneContentProps) {
  return <span className="FeaturedScene__Content grow flex flex-column gap-xxs">{children}</span>;
}
