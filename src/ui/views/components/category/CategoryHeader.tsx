import { ReactNode, MouseEvent } from "react";

import { Text } from "../../../atoms/text/Text";

import "./CategoryHeader.css";
interface ICategoryHeader {
  before?: ReactNode;
  title: string;
  after?: ReactNode;
  options?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function CategoryHeader({ before, title, after, options, onClick }: ICategoryHeader) {
  const catContent = (
    <>
      {before}
      <Text className="truncate" variant="b3" weight="bold">
        {title}
      </Text>
      {after}
    </>
  );

  return (
    <div className="CategoryHeader flex items-center">
      {typeof onClick === "function" ? (
        <button className="CategoryHeader__content grow flex items-center gap-xxs" onClick={onClick}>
          {catContent}
        </button>
      ) : (
        <div className="CategoryHeader__content grow flex items-center gap-xxs">{catContent}</div>
      )}
      {options && <div className="CategoryHeader__options shrink-0">{options}</div>}
    </div>
  );
}
