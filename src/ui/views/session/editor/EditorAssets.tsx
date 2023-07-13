import { Icon } from "../../../atoms/icon/Icon";
import { EditorHeader } from "../../components/editor-header/EditorHeader";
import CrossIC from "../../../../../res/ic/cross.svg";
import WebAssetIC from "../../../../../res/ic/web-asset.svg";
import { IconButton } from "../../../atoms/button/IconButton";
import { Text } from "../../../atoms/text/Text";
import "./EditorAssets.css";
import { AssetUploadModal } from "./AssetUploadModal";
import { Button } from "../../../atoms/button/Button";
import { useFilePicker } from "../../../hooks/useFilePicker";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { Asset, AssetType } from "./assets";

interface EditorAssetsProps {
  requestClose: () => void;
}

export function EditorAssets({ requestClose }: EditorAssetsProps) {
  const { platform } = useHydrogen(true);

  const { fileData, pickFile, dropFile } = useFilePicker(platform, "*");

  const handleAssetUploadClose = () => {
    dropFile();
  };

  const handleAssetSubmit = <T extends AssetType>(asset: Asset<T>) => {
    console.log(asset);
    // TODO: send stat event
  };

  return (
    <div className="EditorAssets grow flex flex-column">
      {fileData.blob && (
        <AssetUploadModal blob={fileData.blob} requestClose={handleAssetUploadClose} onSubmit={handleAssetSubmit} />
      )}
      <EditorHeader className="shrink-0 flex items-center gap-xxs" style={{ padding: "0 var(--sp-xs)" }}>
        <Icon color="surface" size="sm" src={WebAssetIC} />
        <Text className="grow truncate" variant="b2" weight="semi-bold">
          Asset
        </Text>
        <IconButton color="surface" size="sm" label="Close Asset panel" iconSrc={CrossIC} onClick={requestClose} />
      </EditorHeader>
      <div className="grow flex">
        <div className="EditorAssets__drawer shrink-0">drawer</div>
        <div className="grow">
          <Button onClick={() => pickFile()}>Upload Asset</Button>
        </div>
      </div>
    </div>
  );
}
