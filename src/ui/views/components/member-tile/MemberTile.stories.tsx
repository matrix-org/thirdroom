import { Meta } from "@storybook/react";

import { Avatar } from "../../../atoms/avatar/Avatar";
import { Text } from "../../../atoms/text/Text";
import { MemberTile } from "./MemberTile";

export default {
  title: "MemberTile",
  component: MemberTile,
} as Meta<typeof MemberTile>;

export function MemberTileStories() {
  return (
    <div>
      <MemberTile
        avatar={<Avatar shape="circle" name="Robert" bgColor="blue" />}
        content={
          <>
            <Text className="truncate" weight="medium">
              Robert
            </Text>
            <Text className="truncate" color="surface-low" variant="b3">
              @user:server.name
            </Text>
          </>
        }
      />
    </div>
  );
}
