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
import "./UploadScene.css";
import { Footer } from "../../../atoms/footer/Footer";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { AutoFileUpload, AutoUploadInfo } from "../../components/AutoFileUpload";
import { Label } from "../../../atoms/text/Label";
import { Icon } from "../../../atoms/icon/Icon";
import UploadIC from "../../../../../res/ic/upload.svg";

interface UploadSceneProps {
  onSave: (mxc: string, previewMxc: string) => void;
  renderTrigger: (openModal: () => void) => ReactNode;
}
export function UploadScene({ onSave, renderTrigger }: UploadSceneProps) {
  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const [sceneInfo, setSceneInfo] = useState<AutoUploadInfo>({});
  const [previewInfo, setPreviewInfo] = useState<AutoUploadInfo>({});

  const saveChanges = () => {
    if (sceneInfo.mxc && previewInfo.mxc) {
      onSave(sceneInfo.mxc, previewInfo.mxc);
      closeModal();
    }
  };

  return (
    <>
      {renderTrigger(openModal)}
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <Content className="grow">
          <ModalContent
            children={
              <Content
                top={<Header left={<HeaderTitle>Upload Scene</HeaderTitle>} />}
                children={
                  <Scroll>
                    <div className="UploadScene__content">
                      <SettingTile className="grow basis-0" label={<Label>Scene</Label>}>
                        <Text className="UploadScene__info-text" variant="b3" color="surface-low">
                          Upload a 3D scene (*.glb file)
                        </Text>
                        <AutoFileUpload
                          mimeType=".glb"
                          onUploadInfo={setSceneInfo}
                          renderButton={(pickFile) => (
                            <Button onClick={pickFile}>
                              <Icon src={UploadIC} color="on-primary" />
                              Upload Scene
                            </Button>
                          )}
                        />
                      </SettingTile>
                      <SettingTile className="grow basis-0" label={<Label>Scene Preview</Label>}>
                        <Text className="UploadScene__info-text" variant="b3" color="surface-low">
                          Upload a preview image of 3D scene
                        </Text>
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
                      <Button onClick={saveChanges} disabled={!sceneInfo.mxc || !previewInfo.mxc}>
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
                      Uploaded scene preview will appear here.
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
