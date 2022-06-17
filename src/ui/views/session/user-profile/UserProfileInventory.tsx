import { Text } from "../../../atoms/text/Text";
import { Content } from "../../../atoms/content/Content";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { WindowContent } from "../../components/window/WindowContent";
import { WindowAside } from "../../components/window/WindowAside";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";

import "./UserProfileInventory.css";

export function UserProfileInventory() {
  return (
    <WindowContent
      children={
        <Content
          children={
            <Scroll>
              <div className="UserProfileInventory__content" />
            </Scroll>
          }
        />
      }
      aside={
        <WindowAside className="flex">
          <ScenePreview
            className="grow"
            fallback={
              <Text variant="b3" color="surface-low" weight="medium">
                Your default avatar preview will appear here.
              </Text>
            }
          />
        </WindowAside>
      }
    />
  );
}
