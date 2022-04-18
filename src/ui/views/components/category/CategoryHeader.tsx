import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";

import "./CategoryHeader.css";
interface ICategoryHeader {
  iconSrc?: string;
  title: string;
  options?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function CategoryHeader({ iconSrc, title, options, onClick }: ICategoryHeader) {
  const catContent = (
    <>
      {iconSrc && <Icon className="shrink-0" src={iconSrc} size="sm" color="var(--tc-surface)" />}
      <Text className="truncate" variant="b3" weight="bold">
        {title}
      </Text>
    </>
  );

  return (
    <div className="CategoryHeader flex items-center">
      {typeof onClick === "function" ? (
        <button className="CategoryHeader__content grow flex items-center" onClick={onClick}>
          {catContent}
        </button>
      ) : (
        <div className="CategoryHeader__content grow flex items-center">{catContent}</div>
      )}
      {options && <div className="CategoryHeader__options shrink-0">{options}</div>}
    </div>
  );
}
