import { ChatHeader } from "./ChatHeader";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { IconButton } from "../../../atoms/button/IconButton";
import CrossIC from "../../../../../res/ic/cross.svg";
import MinusIC from "../../../../../res/ic/minus.svg";

export const title = "ChatHeader";

export default function ChatHeaderStories() {
  return (
    <div style={{ backgroundColor: "white", maxWidth: "500px" }}>
      <ChatHeader
        avatar={<Avatar size="sm" name="The Gaming Bunch" bgColor="#9a1c75" />}
        title="The Gaming Bunch"
        options={
          <>
            <IconButton variant="surface" label="Minimize" iconSrc={MinusIC} onClick={() => console.log("clicked")} />
            <IconButton variant="surface" label="Close" iconSrc={CrossIC} onClick={() => console.log("clicked")} />
          </>
        }
      />
    </div>
  );
}
