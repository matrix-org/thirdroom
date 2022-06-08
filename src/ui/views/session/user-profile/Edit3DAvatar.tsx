import { ReactNode, useState } from "react";

import { Modal } from "../../../atoms/modal/Modal";
import { ModalContent } from "../../../atoms/modal/ModalContent";
import { ModalAside } from "../../../atoms/modal/ModalAside";
import { Text } from "../../../atoms/text/Text";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Button } from "../../../atoms/button/Button";
import { Label } from "../../../atoms/text/Label";
import { Content } from "../../../atoms/content/Content";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { Scroll } from "../../../atoms/scroll/Scroll";
import "./Edit3DAvatar.css";
import { Footer } from "../../../atoms/footer/Footer";

interface Edit3DAvatarProps {
  renderTrigger: (openModal: () => void) => ReactNode;
}

export function Edit3DAvatar({ renderTrigger }: Edit3DAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {renderTrigger(openModal)}
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <Content className="grow">
          <ModalContent
            children={
              <Content
                top={<Header left={<HeaderTitle>Edit Avatar</HeaderTitle>} />}
                children={
                  <Scroll>
                    <div className="Edit3DAvatar__content">
                      <div className="flex sp-lg">
                        <SettingTile className="grow" label={<Label>Avatar</Label>}>
                          <Button>Upload Avatar</Button>
                        </SettingTile>
                        <SettingTile className="grow" label={<Label>Avatar Preview</Label>}>
                          <Button>Upload Preview</Button>
                        </SettingTile>
                      </div>
                    </div>
                  </Scroll>
                }
                bottom={
                  <Footer
                    left={
                      <Button onClick={closeModal} fill="outline">
                        Cancel
                      </Button>
                    }
                    right={<Button>Save</Button>}
                  />
                }
              />
            }
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
        </Content>
      </Modal>
    </>
  );
}
