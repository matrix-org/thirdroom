import { Avatar } from "../../../atoms/avatar/Avatar";
import { Button } from "../../../atoms/button/Button";
import { Content } from "../../../atoms/content/Content";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { RoomPreviewCard } from "../../components/room-preview-card/RoomPreviewCard";
import "./DiscoverHome.css";

export function DiscoverHome() {
  return (
    <Scroll>
      <Content className="DiscoverHome__content">
        <div className="flex flex-column gap-xs">
          <div className="flex gap-xs">
            <RoomPreviewCard
              className="grow"
              avatar={<Avatar size="lg" bgColor="blue" name="Arch linux" />}
              name="Arch Linux"
              desc="Free play games room | No harrassment or spam | !games for full list | Chat channel: #gamer-zone:matrix.org"
              memberCount={234}
              options={
                <Button variant="secondary" onClick={() => console.log("clicked")}>
                  Join
                </Button>
              }
            />
            <RoomPreviewCard
              className="grow"
              avatar={<Avatar size="lg" bgColor="blue" name="Arch linux" />}
              name="Arch Linux"
              desc="Free play games room | No harrassment or spam | !games for full list | Chat channel: #gamer-zone:matrix.org"
              memberCount={234}
              options={
                <Button variant="secondary" onClick={() => console.log("clicked")}>
                  Join
                </Button>
              }
            />
          </div>
          <div className="flex gap-xs">
            <RoomPreviewCard
              className="grow"
              avatar={<Avatar size="lg" bgColor="blue" name="Arch linux" />}
              name="Arch Linux"
              desc="Free play games room | No harrassment or spam | !games for full list | Chat channel: #gamer-zone:matrix.org"
              memberCount={234}
              options={
                <Button variant="secondary" onClick={() => console.log("clicked")}>
                  Join
                </Button>
              }
            />
            <RoomPreviewCard
              className="grow"
              avatar={<Avatar size="lg" bgColor="blue" name="Arch linux" />}
              name="Arch Linux"
              desc="Free play games room | No harrassment or spam | !games for full list | Chat channel: #gamer-zone:matrix.org"
              memberCount={234}
              options={
                <Button variant="secondary" onClick={() => console.log("clicked")}>
                  Join
                </Button>
              }
            />
          </div>
        </div>
      </Content>
    </Scroll>
  );
}
