import { Avatar } from "../../../atoms/avatar/Avatar";
import { Button } from "../../../atoms/button/Button";
import { RoomPreviewCard } from "./RoomPreviewCard";

export const title = "RoomPreviewCard";

export default function RoomPreviewCardStories() {
  return (
    <div>
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
    </div>
  );
}
