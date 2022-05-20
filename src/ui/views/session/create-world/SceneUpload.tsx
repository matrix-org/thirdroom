import { useEffect, useState } from "react";
import { IBlobHandle } from "@thirdroom/hydrogen-view-sdk";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { useAttachmentUpload } from "../../../hooks/useAttachmentUpload";
import { Label } from "../../../atoms/text/Label";
import { Text } from "../../../atoms/text/Text";
import { Button } from "../../../atoms/button/Button";
import { Icon } from "../../../atoms/icon/Icon";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { bytesToSize } from "../../../utils/common";
import { useDebounce } from "../../../hooks/useDebounce";
import UploadIC from "../../../../../res/ic/upload.svg";

export function SceneUpload({ onMxcChange }: { onMxcChange: (Url?: string) => void }) {
  const { session, platform } = useHydrogen(true);
  const [sceneBlob, setSceneBlob] = useState<IBlobHandle>();
  const [sentBytes, setProgress] = useState(0);

  const {
    mxc,
    upload,
    cancel: cancelUpload,
  } = useAttachmentUpload(session._hsApi, platform, useDebounce(setProgress, { wait: 200, immediate: true }));

  useEffect(() => {
    setProgress(0);
    if (sceneBlob) upload(sceneBlob);
    else cancelUpload();
  }, [sceneBlob, upload, cancelUpload]);

  useEffect(() => onMxcChange(mxc), [mxc, onMxcChange]);

  return (
    <SettingTile className="grow basis-0" label={<Label>Scene *</Label>}>
      <div className="flex flex-column items-start gap-xxs">
        {sceneBlob ? (
          <>
            <Text variant="b3" weight="medium">
              File: {sceneBlob.nativeBlob.name}
            </Text>
            <Text weight={mxc ? "regular" : "bold"} variant="b3">
              {mxc && `Size: ${bytesToSize(sceneBlob.size)}`}
              {!mxc && `Uploading: ${bytesToSize(sentBytes)} / ${bytesToSize(sceneBlob.size)}`}
            </Text>
            <Button onClick={() => setSceneBlob(undefined)} fill="outline">
              Clear Scene
            </Button>
          </>
        ) : (
          <>
            <Text variant="b3">Upload gltf world scene file.</Text>
            <Button
              onClick={async () => {
                const data = await platform.openFile("*");
                if (!data) return;
                setSceneBlob(data.blob);
              }}
            >
              <Icon src={UploadIC} color="on-primary" />
              Upload Scene
            </Button>
          </>
        )}
      </div>
    </SettingTile>
  );
}
