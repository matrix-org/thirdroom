import classNames from "classnames";
import { ReactNode } from "react";

import "./LeftRightContent.css";

export function LeftRightContent({
  title,
  content,
  imgSrc,
  imgAlt,
  flipped = false,
  flipRatio = false,
}: {
  title: ReactNode;
  content: ReactNode;
  imgSrc: string;
  imgAlt: string;
  flipped?: boolean;
  flipRatio?: boolean;
}) {
  return (
    <div
      className={classNames(
        "LeftRightContent",
        { "LeftRightContent--flipped": flipped },
        { "LeftRightContent--flipRatio": flipRatio }
      )}
    >
      <div className="LeftRightContent__text flex flex-column gap-md">
        {title}
        {content}
      </div>
      <div className="LeftRightContent__image">
        <img src={imgSrc} alt={imgAlt} />
      </div>
    </div>
  );
}
