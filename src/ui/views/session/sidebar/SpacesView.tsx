import "./SpacesView.css";
import { IconButton } from "../../../atoms/button/IconButton";
import HomeIC from "../../../../../res/ic/home.svg";
import GridIC from "../../../../../res/ic/grid.svg";

export function SpacesView() {
  return (
    <div className="SpacesView flex flex-column">
      <div className="SpacesView__scrollable grow flex flex-column items-center">
        <IconButton size="small" label="Home" shadedSurface iconSrc={HomeIC} onClick={() => false} />
        <IconButton size="small" label="Grid" shadedSurface iconSrc={GridIC} onClick={() => false} />
      </div>
    </div>
  );
}
