import { FormEvent, ReactNode, useState } from "react";

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
import "./SceneSubmission.css";
import { Footer } from "../../../atoms/footer/Footer";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { AutoFileUpload, AutoUploadInfo } from "../../components/AutoFileUpload";
import { Label } from "../../../atoms/text/Label";
import { Icon } from "../../../atoms/icon/Icon";
import UploadIC from "../../../../../res/ic/upload.svg";
import { Input } from "../../../atoms/input/Input";

export interface SceneData {
  sceneUrl: string;
  scenePreviewUrl: string;
  sceneName: string;
  sceneDescription: string;
  sceneAuthorName: string;
  sceneAuthorUrl?: string;
  sceneSourceUrl?: string;
  sceneLicense: string;
  sceneVersion: number;
}

export function sceneDataToScene(data: SceneData) {
  return {
    url: data.sceneUrl,
    preview_url: data.scenePreviewUrl,
    name: data.sceneName,
    description: data.sceneDescription,
    author_name: data.sceneAuthorName,
    license: data.sceneLicense,
    version: data.sceneVersion,
    author_url: data.sceneAuthorUrl,
    source_url: data.sceneSourceUrl,
  };
}

interface SceneSubmissionProps {
  onSave: (data: SceneData) => void;
  renderTrigger: (openModal: () => void) => ReactNode;
}
export function SceneSubmission({ onSave, renderTrigger }: SceneSubmissionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const [sceneInfo, setSceneInfo] = useState<AutoUploadInfo>({});
  const [previewInfo, setPreviewInfo] = useState<AutoUploadInfo>({});

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();

    const { sceneNameInput, sceneDescriptionInput, authorNameInput, licenseInput, authorURLInput, sourceURLInput } =
      evt.target as typeof evt.target & {
        sceneNameInput: HTMLInputElement;
        sceneDescriptionInput: HTMLInputElement;
        authorNameInput: HTMLInputElement;
        licenseInput: HTMLInputElement;
        authorURLInput: HTMLInputElement;
        sourceURLInput: HTMLInputElement;
      };
    const sceneName = sceneNameInput.value.trim();
    const sceneDescription = sceneDescriptionInput.value.trim();
    const sceneAuthorName = authorNameInput.value.trim();
    const sceneLicense = licenseInput.value.trim();
    const sceneAuthorUrl = authorURLInput.value.trim() || undefined;
    const sceneSourceUrl = sourceURLInput.value.trim() || undefined;

    if (sceneInfo.mxc && previewInfo.mxc) {
      onSave({
        sceneUrl: sceneInfo.mxc,
        scenePreviewUrl: previewInfo.mxc,
        sceneName,
        sceneDescription,
        sceneAuthorName,
        sceneLicense,
        sceneVersion: 1,
        sceneAuthorUrl,
        sceneSourceUrl,
      });
      closeModal();
    }
  };

  const canSave = !!sceneInfo.mxc && !!previewInfo.mxc;

  return (
    <>
      {renderTrigger(openModal)}
      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <Content className="grow">
          <ModalContent
            children={
              <Content
                onSubmit={handleSubmit}
                top={<Header left={<HeaderTitle>Scene Submission</HeaderTitle>} />}
                children={
                  <Scroll>
                    <div className="SceneSubmission__content">
                      <div className="flex gap-md">
                        <SettingTile className="grow basis-0" label={<Label>Scene</Label>}>
                          <Text className="SceneSubmission__info-text" variant="b3" color="surface-low">
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
                          <Text className="SceneSubmission__info-text" variant="b3" color="surface-low">
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
                      <div className="flex gap-md">
                        <SettingTile className="grow basis-0" label={<Label>Name</Label>}>
                          <Input name="sceneNameInput" required />
                        </SettingTile>
                        <SettingTile className="grow basis-0" label={<Label>Description</Label>}>
                          <Input name="sceneDescriptionInput" required />
                        </SettingTile>
                      </div>

                      <div className="flex gap-md">
                        <SettingTile className="grow basis-0" label={<Label>Author Name</Label>}>
                          <Input name="authorNameInput" required />
                        </SettingTile>
                        <SettingTile className="grow basis-0" label={<Label>License</Label>}>
                          <Input name="licenseInput" required />
                        </SettingTile>
                      </div>
                      <div className="flex gap-md">
                        <SettingTile className="grow basis-0" label={<Label>Author URL (optional)</Label>}>
                          <Input name="authorURLInput" />
                        </SettingTile>
                        <SettingTile className="grow basis-0" label={<Label>Source URL (optional)</Label>}>
                          <Input name="sourceURLInput" />
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
                    right={
                      <Button type="submit" disabled={!canSave}>
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
