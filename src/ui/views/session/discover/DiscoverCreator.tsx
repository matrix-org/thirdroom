import { Room } from "@thirdroom/hydrogen-view-sdk";

import { Content } from "../../../atoms/content/Content";
import { Scroll } from "../../../atoms/scroll/Scroll";

interface DiscoverCreatorProps {
  room: Room;
}
export function DiscoverCreator({ room }: DiscoverCreatorProps) {
  return (
    <Scroll>
      <Content className="DiscoverCreator__content">
        <div className="flex flex-column gap-md">{room.name}</div>
      </Content>
    </Scroll>
  );
}
