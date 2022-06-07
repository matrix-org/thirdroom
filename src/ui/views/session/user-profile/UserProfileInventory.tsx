import { ReactNode } from "react";

import { Text } from "../../../atoms/text/Text";
import { Content } from "../../../atoms/content/Content";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { WindowContent } from "../../components/window/WindowContent";
import { WindowAside } from "../../components/window/WindowAside";
import { Modal } from "../../../atoms/modal/Modal";
import { ModalContent } from "../../../atoms/modal/ModalContent";
import { ModalAside } from "../../../atoms/modal/ModalAside";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { IconButton } from "../../../atoms/button/IconButton";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import AddIC from "../../../../../res/ic/add.svg";

import "./UserProfileInventory.css";

function Edit3DAvatar({ children }: { children: ReactNode }) {
  return (
    <Modal
      content={
        <ModalContent
          children={<p>Hello, World!</p>}
          aside={
            <ModalAside className="flex">
              <ScenePreview
                className="grow"
                fallback={
                  <Text variant="b3" color="surface-low" weight="medium">
                    Uploaded avatar preview will appear here.
                  </Text>
                }
              />
            </ModalAside>
          }
        />
      }
    >
      {children}
    </Modal>
  );
}

export function UserProfileInventory() {
  return (
    <WindowContent
      children={
        <Content
          children={
            <Scroll>
              <div className="UserProfileInventory__content">
                <Edit3DAvatar>
                  <Thumbnail size="sm" className="flex">
                    <IconButton size="xl" iconSrc={AddIC} label="Add world avatar" />
                  </Thumbnail>
                </Edit3DAvatar>
              </div>
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
