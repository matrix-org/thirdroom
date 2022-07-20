import { Avatar } from "../../../atoms/avatar/Avatar";
import { Text } from "../../../atoms/text/Text";
import { MemberTile } from "./MemberTile";

export const title = "MemberTile";

export default function MemberTileStories() {
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
