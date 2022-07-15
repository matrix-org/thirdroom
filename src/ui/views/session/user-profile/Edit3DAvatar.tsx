import { ReactNode, useState } from "react";

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
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { AutoFileUpload, AutoUploadInfo } from "../../components/AutoFileUpload";
import { Label } from "../../../atoms/text/Label";
import { Icon } from "../../../atoms/icon/Icon";
import UploadIC from "../../../../../res/ic/upload.svg";

interface Edit3DAvatarProps {
  renderTrigger: (openModal: () => void) => ReactNode;
}

export function Edit3DAvatar({ renderTrigger }: Edit3DAvatarProps) {
  const { session, profileRoom } = useHydrogen(true);
  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const [avatarInfo, setAvatarInfo] = useState<AutoUploadInfo>({});
  const [previewInfo, setPreviewInfo] = useState<AutoUploadInfo>({});

  const saveChanges = () => {
    if (!avatarInfo.mxc && !previewInfo.mxc) return;
    const update = (avatarUrl: string, previewUrl: string) => {
      session.hsApi.sendState(profileRoom.id, "org.matrix.msc3815.world.profile", "", {
        avatar_url: avatarUrl,
        avatar_preview_url: previewUrl,
      });
    };
    if (avatarInfo.mxc && previewInfo.mxc) {
      update(avatarInfo.mxc, previewInfo.mxc);
    } else {
      profileRoom.getStateEvent("org.matrix.msc3815.world.profile").then((event) => {
        const avatarUrl: string = event?.event.content.avatar_url;
        const avatarPreviewUrl: string = event?.event.content.avatar_preview_url;
        update(avatarInfo.mxc ?? avatarUrl, previewInfo.mxc ?? avatarPreviewUrl);
      });
    }
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
                      <SettingTile className="grow basis-0" label={<Label>Avatar</Label>}>
                        <AutoFileUpload
                          mimeType=".glb"
                          onUploadInfo={setAvatarInfo}
                          renderButton={(pickFile) => (
                            <Button onClick={pickFile}>
                              <Icon src={UploadIC} color="on-primary" />
                              Upload Avatar
                            </Button>
                          )}
                        />
                      </SettingTile>
                      <SettingTile className="grow basis-0" label={<Label>Avatar Preview</Label>}>
                        <AutoFileUpload
                          mimeType="image/*"
                          onUploadInfo={setPreviewInfo}
                          renderButton={(pickFile) => (
                            <Button onClick={pickFile}>
                              <Icon src={UploadIC} color="on-primary" />
                              Upload Preview
                            </Button>
                          )}
                        />
                      </SettingTile>
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
                      <Button onClick={saveChanges} disabled={!avatarInfo.mxc && !previewInfo.mxc}>
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
                  src={previewInfo.url}
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
