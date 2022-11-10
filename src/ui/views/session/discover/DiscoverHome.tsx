import { Room } from "@thirdroom/hydrogen-view-sdk";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { Button } from "../../../atoms/button/Button";
import { Content } from "../../../atoms/content/Content";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Label } from "../../../atoms/text/Label";
import { RoomPreviewCard } from "../../components/room-preview-card/RoomPreviewCard";
import ArrowForwardIC from "../../../../../res/ic/arrow-forward.svg";
import "./DiscoverHome.css";
import { DiscoverGroup, DiscoverGroupGrid, DiscoverMoreButton } from "../../components/discover-group/DiscoverGroup";
import LogoSvg from "../../../../../res/svg/logo.svg";
import {
  FeaturedScene,
  FeaturedSceneContent,
  FeaturedSceneThumbnail,
} from "../../components/featured-scene/FeaturedScene";
import { Text } from "../../../atoms/text/Text";
import { useStateEvents } from "../../../hooks/useStateEvents";

export function DiscoverHome({ room }: { room: Room }) {
  useStateEvents(room, "m.room.name");

  return (
    <Scroll>
      <Content className="DiscoverHome__content">
        <DiscoverGroup
          label={<Label>Featured Public Worlds</Label>}
          content={
            <DiscoverGroupGrid>
              <RoomPreviewCard
                avatar={<Avatar shape="circle" size="lg" bgColor="blue" name="Arch linux" />}
                name="Arch Linux"
                desc="Free play games room | No harrassment or spam | !games for full list | Chat channel: #gamer-zone:matrix.org"
                memberCount={234}
                options={
                  <Button variant="secondary" size="sm" onClick={() => console.log("clicked")}>
                    Join
                  </Button>
                }
              />
            </DiscoverGroupGrid>
          }
          footer={
            <div className="flex justify-end">
              <DiscoverMoreButton text="Browse All Public Worlds" iconSrc={ArrowForwardIC} />
            </div>
          }
        />
        <DiscoverGroup
          label={<Label>Featured Scenes</Label>}
          content={
            <DiscoverGroupGrid itemMinWidth={300} gap="md">
              <FeaturedScene onClick={() => false}>
                <FeaturedSceneThumbnail src={LogoSvg} alt="scene" />
                <FeaturedSceneContent>
                  <Text variant="b3">Rad Designs</Text>
                  <Text>Zombie city</Text>
                </FeaturedSceneContent>
              </FeaturedScene>
            </DiscoverGroupGrid>
          }
          footer={
            <div className="flex justify-end">
              <DiscoverMoreButton text="Browse All Scenes" iconSrc={ArrowForwardIC} />
            </div>
          }
        />
      </Content>
    </Scroll>
  );
}
