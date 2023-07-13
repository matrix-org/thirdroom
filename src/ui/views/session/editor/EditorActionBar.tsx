import { Icon } from "../../../atoms/icon/Icon";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import AddIC from "../../../../../res/ic/add.svg";
import "./EditorActionBar.css";
// import { PaginationDot } from "../../../atoms/pagination/PaginationDot";

interface EditorActionBarProps {
  toggleAssets: () => void;
}

export function EditorActionBar({ toggleAssets }: EditorActionBarProps) {
  return (
    <div className="EditorActionBar flex items-center gap-xs">
      <Thumbnail size="xxs">
        <button onClick={toggleAssets} className="EditorActionBar__plusBtn flex justify-center items-center">
          <Icon color="on-primary" src={AddIC} size="lg" />
        </button>
      </Thumbnail>

      {/* <Thumbnail size="xxs">
        <Icon src={AddIC} size="lg" />
      </Thumbnail>
      <Thumbnail size="xxs">
        <Icon src={AddIC} size="lg" />
      </Thumbnail>
      <Thumbnail size="xxs">
        <Icon src={AddIC} size="lg" />
      </Thumbnail>
      <Thumbnail size="xxs">
        <Icon src={AddIC} size="lg" />
      </Thumbnail>
      <Thumbnail size="xxs">
        <Icon src={AddIC} size="lg" />
      </Thumbnail>
      <div className="flex flex-column gap-xxs">
        <PaginationDot active />
        <PaginationDot />
        <PaginationDot />
        <PaginationDot />
      </div> */}
    </div>
  );
}
