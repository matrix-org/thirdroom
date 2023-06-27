import { Meta } from "@storybook/react";

import { ActiveChatTile } from "./ActiveChatTile";
import { Avatar } from "../../../atoms/avatar/Avatar";

export default {
  title: "ActiveChatTile",
  component: ActiveChatTile,
} as Meta<typeof ActiveChatTile>;

export function ActiveChatTileStories() {
  return (
    <div style={{ maxWidth: "380px" }}>
      <ActiveChatTile
        isActive={false}
        roomId="xyz"
        avatar={<Avatar size="sm" name="The Gaming Bunch" bgColor="blue" />}
        title="The Gaming Bunch"
        onClick={(r) => console.log(r)}
        onClose={(r) => console.log(r)}
      />
      <ActiveChatTile
        isActive={true}
        roomId="xyz"
        avatar={<Avatar size="sm" name="The Gaming Bunch" bgColor="blue" />}
        title="The Gaming Bunch"
        onClick={(r) => console.log(r)}
        onClose={(r) => console.log(r)}
      />
    </div>
  );
}
