import { Chip } from "./Chip";
import { Text } from "../text/Text";
import { Avatar } from "../avatar/Avatar";

export const title = "Chip";

export default function ChipStories() {
  return (
    <div>
      <Chip>
        <Avatar name="Robert" bgColor="blue" size="xxs" shape="circle" />
        <Text variant="b2" weight="medium">
          Robert
        </Text>
      </Chip>
      <Chip onClick={(e) => console.log(e)}>
        <Avatar name="Robert" bgColor="blue" size="xxs" shape="circle" />
        <Text variant="b2" weight="medium">
          Robert
        </Text>
      </Chip>
    </div>
  );
}
