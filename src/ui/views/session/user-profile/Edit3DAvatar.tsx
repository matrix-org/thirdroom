import { ReactNode, useState } from "react";
import { IBlobHandle } from "@thirdroom/hydrogen-view-sdk";

import { Modal } from "../../../atoms/modal/Modal";
import { ModalContent } from "../../../atoms/modal/ModalContent";
import { ModalAside } from "../../../atoms/modal/ModalAside";
import { Text } from "../../../atoms/text/Text";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import { Button } from "../../../atoms/button/Button";
import { Content } from "../../../atoms/content/Content";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { Scroll } from "../../../atoms/scroll/Scroll";
import "./Edit3DAvatar.css";
import { Footer } from "../../../atoms/footer/Footer";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { AvatarUpload } from "./AvatarUpload";
import { AvatarPreviewUpload } from "./AvatarPreviewUpload";

interface Edit3DAvatarProps {
  renderTrigger: (openModal: () => void) => ReactNode;
}

export function Edit3DAvatar({ renderTrigger }: Edit3DAvatarProps) {
  const { session, profileRoom } = useHydrogen(true);
  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [avatarPrevUrl, setAvatarPrevUrl] = useState<string>();
  const [avatarPrevBlob, setAvatarPrevBlob] = useState<IBlobHandle>();

  const saveChanges = () => {
    if (!avatarUrl || !avatarPrevUrl) return;
    session.hsApi.sendState(profileRoom.id, "org.matrix.msc3815.world.profile", "", {
      avatar_url: avatarUrl,
      avatar_preview_url: avatarPrevUrl,
    });
    closeModal();
  };

  return (
    <>
      {renderTrigger(openModal)}
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <Content className="grow">
          <ModalContent
            children={
              <Content
                top={<Header left={<HeaderTitle>Edit 3D Avatar</HeaderTitle>} />}
                children={
                  <Scroll>
                    <div className="Edit3DAvatar__content">
                      <AvatarUpload onMxcChange={setAvatarUrl} />
                      <AvatarPreviewUpload onMxcChange={setAvatarPrevUrl} onBlobChange={setAvatarPrevBlob} />
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
                    right={
                      <Button onClick={saveChanges} disabled={!avatarUrl || !avatarPrevUrl}>
                        Save
                      </Button>
                    }
                  />
                }
              />
            }
            aside={
              <ModalAside className="flex">
                <ScenePreview
                  className="grow"
                  src={avatarPrevBlob ? URL.createObjectURL(avatarPrevBlob.nativeBlob) : undefined}
                  alt="3D Avatar preview"
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
