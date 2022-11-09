import { Content } from "../../../atoms/content/Content";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import ExploreIC from "../../../../../res/ic/explore.svg";
import { Icon } from "../../../atoms/icon/Icon";
import { Window } from "../../components/window/Window";
import { DiscoverHome } from "./DiscoverHome";
import { SegmentControl } from "../../../atoms/segment-control/SegmentControl";
import { SegmentControlItem } from "../../../atoms/segment-control/SegmentControlItem";

export function DiscoverView() {
  return (
    <Window>
      <Content
        top={
          <Header
            left={
              <HeaderTitle icon={<Icon color="surface" className="shrink-0" src={ExploreIC} />}>Discover</HeaderTitle>
            }
            center={
              <SegmentControl>
                <SegmentControlItem value="Overview" isSelected={true} onSelect={() => false}>
                  Home
                </SegmentControlItem>
                <SegmentControlItem value="Inventory" onSelect={() => false}>
                  Admin
                </SegmentControlItem>
              </SegmentControl>
            }
          />
        }
      >
        <DiscoverHome />
      </Content>
    </Window>
  );
}
