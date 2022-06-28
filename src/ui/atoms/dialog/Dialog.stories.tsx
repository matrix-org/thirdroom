import { Dialog } from "./Dialog";
import { Button } from "../button/Button";
import { Text } from "../text/Text";

export const title = "Dialog";

export default function DialogStories() {
  return (
    <Dialog trigger={<Button>Open Dialog</Button>}>
      <Text variant="s1" weight="bold">
        Dialog
      </Text>
      <div style={{ height: "200px" }} />
    </Dialog>
  );
}
