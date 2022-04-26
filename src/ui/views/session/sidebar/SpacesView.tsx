import { SidebarTab } from "../../components/sidebar-tab/SidebarTab";
import PlanetIC from "../../../../../res/ic/planet.svg";
import ExploreIC from "../../../../../res/ic/explore.svg";
import "./SpacesView.css";

export function SpacesView() {
  return (
    <div className="SpacesView flex flex-column">
      <div className="SpacesView__scrollable grow flex flex-column items-center">
        <SidebarTab
          onClick={() => console.log("clicked")}
          isActive={true}
          name="Home"
          iconSrc={PlanetIC}
          variant="surface-low"
        />
        <SidebarTab onClick={() => console.log("clicked")} name="Explore" iconSrc={ExploreIC} variant="danger" />
      </div>
    </div>
  );
}
