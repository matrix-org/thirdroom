import { SidebarTab } from "./SidebarTab";
import PlanetIC from "../../../../../res/ic/planet.svg";
import ExploreIC from "../../../../../res/ic/explore.svg";
import AddIC from "../../../../../res/ic/add.svg";

export const title = "SidebarTab";

export default function SidebarTabStories() {
  return (
    <div className="flex" style={{ backgroundColor: "white", maxWidth: "380px" }}>
      <SidebarTab onClick={() => console.log("clicked")} name="Home" iconSrc={AddIC} />
      <SidebarTab onClick={() => console.log("clicked")} name="Home" iconSrc={PlanetIC} variant="surface-low" />
      <SidebarTab onClick={() => console.log("clicked")} name="Home" iconSrc={ExploreIC} variant="primary" />
      <SidebarTab onClick={() => console.log("clicked")} name="Home" iconSrc={ExploreIC} variant="secondary" />
      <SidebarTab onClick={() => console.log("clicked")} name="Home" iconSrc={ExploreIC} variant="danger" />
      <SidebarTab
        onClick={() => console.log("clicked")}
        name="Home"
        iconSrc={PlanetIC}
        variant="surface-low"
        isActive={true}
      />
    </div>
  );
}
