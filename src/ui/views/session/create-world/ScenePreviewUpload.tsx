import { useEffect, useState, useCallback } from "react";
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

export function ScenePreviewUpload({
  onMxcChange,
  onBlobChange,
}: {
  onMxcChange: (url?: string) => void;
  onBlobChange: (blob?: IBlobHandle) => void;
}) {
  const { session, platform } = useHydrogen(true);
  const [scenePrevBlob, setScenePrevBlob] = useState<IBlobHandle>();
  const [sentBytes, setProgress] = useState(0);
  const handleProgress = useCallback((sentBytes: number) => {
    setProgress(sentBytes);
  }, []);
  const {
    mxc,
    upload,
    cancel: cancelUpload,
  } = useAttachmentUpload(session._hsApi, platform, useDebounce(handleProgress, { wait: 200, immediate: true }));

  useEffect(() => {
    onBlobChange(scenePrevBlob);
    setProgress(0);
    if (scenePrevBlob) upload(scenePrevBlob);
    else cancelUpload();
  }, [scenePrevBlob, onBlobChange, upload, cancelUpload]);

  useEffect(() => onMxcChange(mxc), [mxc, onMxcChange]);

  return (
    <SettingTile className="grow basis-0" label={<Label>Scene Preview *</Label>}>
      <div className="flex flex-column items-start gap-xxs">
        {scenePrevBlob ? (
          <>
            <Text variant="b3" weight="medium">
              File: {scenePrevBlob.nativeBlob.name}
            </Text>
            <Text weight={mxc ? "regular" : "bold"} variant="b3">
              {mxc && `Size: ${bytesToSize(scenePrevBlob.size)}`}
              {!mxc && `Uploading: ${bytesToSize(sentBytes)} / ${bytesToSize(scenePrevBlob.size)}`}
            </Text>
            <Button size="mds" onClick={() => setScenePrevBlob(undefined)} fill="outline">
              Clear Preview
            </Button>
          </>
        ) : (
          <>
            <Text variant="b3">Upload world scene preview.</Text>
            <Button
              size="mds"
              onClick={async () => {
                const data = await platform.openFile("image/*");
                if (!data) return;
                setScenePrevBlob(data.blob);
              }}
            >
              <Icon src={UploadIC} color="on-primary" />
              Upload Preview
            </Button>
          </>
        )}
      </div>
    </SettingTile>
  );
}
