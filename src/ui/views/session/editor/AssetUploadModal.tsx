import { IBlobHandle } from "@thirdroom/hydrogen-view-sdk";

import { Button } from "../../../atoms/button/Button";
import { Content } from "../../../atoms/content/Content";
import { Footer } from "../../../atoms/footer/Footer";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { Input } from "../../../atoms/input/Input";
import { Modal } from "../../../atoms/modal/Modal";
import { ModalAside } from "../../../atoms/modal/ModalAside";
import { ModalContent } from "../../../atoms/modal/ModalContent";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Label } from "../../../atoms/text/Label";
import { Text } from "../../../atoms/text/Text";
import { useAutoUpload } from "../../../hooks/useAutoUpload";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { AttributionCard } from "../../components/attribution-card/AttributionCard";
import { FileUploadCard, FileUploadErrorCard } from "../../components/file-upload-card/FileUploadCard";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Asset, AssetType } from "./assets";

interface AssetUploadModalProps {
  blob: IBlobHandle;
  requestClose: () => void;
  onSubmit: <T extends AssetType>(asset: Asset<T>) => void;
}

export function AssetUploadModal({ blob, requestClose, onSubmit }: AssetUploadModalProps) {
  const { session } = useHydrogen(true);
  const { progress, error } = useAutoUpload(session, blob);

  return (
    <Modal open={true}>
      <Content className="grow">
        <ModalContent
          children={
            <Content
              top={<Header left={<HeaderTitle>Asset Upload</HeaderTitle>} />}
              children={
                <Scroll>
                  <div style={{ padding: "var(--sp-md)" }} className="flex flex-column gap-md">
                    {error ? (
                      <FileUploadErrorCard name={error.name} message={error.message} onUploadDrop={requestClose} />
                    ) : (
                      <FileUploadCard
                        name={blob.nativeBlob.name}
                        sentBytes={progress}
                        totalBytes={blob.size}
                        onUploadDrop={requestClose}
                      />
                    )}
                    <div className="flex gap-md">
                      <SettingTile className="grow basis-0" label={<Label>Asset Name</Label>}>
                        <Input defaultValue={blob.nativeBlob.name} required />
                      </SettingTile>
                      <SettingTile className="grow basis-0" label={<Label>Asset Description</Label>}>
                        <Input required />
                      </SettingTile>
                    </div>
                    <div className="flex flex-column gap-xs">
                      <Label>Attributions</Label>
                      <AttributionCard />
                    </div>
                  </div>
                </Scroll>
              }
              bottom={
                <Footer
                  left={
                    <Button onClick={requestClose} fill="outline">
                      Cancel
                    </Button>
                  }
                  right={<Button type="submit">Save</Button>}
                />
              }
            />
          }
          aside={
            <ModalAside className="flex">
              <ScenePreview
                className="grow"
                src=""
                alt="Preview"
                fallback={
                  <Text variant="b3" color="surface-low" weight="medium">
                    Uploaded Asset preview will appear here.
                  </Text>
                }
              />
            </ModalAside>
          }
        />
      </Content>
    </Modal>
  );
}
