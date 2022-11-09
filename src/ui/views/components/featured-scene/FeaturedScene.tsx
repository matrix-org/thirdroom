import classNames from "classnames";
import { MouseEvent, ReactNode } from "react";

import "./FeaturedScene.css";

interface FeaturedSceneProps {
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
}
export function FeaturedScene({ className, onClick, children }: FeaturedSceneProps) {
  return (
    <button className={classNames("FeaturedScene flex flex-column", className)} onClick={onClick}>
      {children}
    </button>
  );
}

interface FeaturedSceneThumbnailProps {
  className?: string;
  src: string;
  alt: string;
}
export function FeaturedSceneThumbnail({ className, src, alt }: FeaturedSceneThumbnailProps) {
  return <img className={classNames("FeaturedScene__Thumbnail", className)} draggable="false" src={src} alt={alt} />;
}

interface FeaturedSceneContentProps {
  children: ReactNode;
}

export function FeaturedSceneContent({ children }: FeaturedSceneContentProps) {
  return <span className="FeaturedScene__Content flex flex-column gap-xxs">{children}</span>;
}
