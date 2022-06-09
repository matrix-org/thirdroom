import { useCallback, useEffect, useState } from "react";
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

export function AvatarPreviewUpload({
  onMxcChange,
  onBlobChange,
}: {
  onMxcChange: (url?: string) => void;
  onBlobChange: (blob?: IBlobHandle) => void;
}) {
  const { session, platform } = useHydrogen(true);
  const [avatarPrevBlob, setAvatarPrevBlob] = useState<IBlobHandle>();
  const [sentBytes, setProgress] = useState(0);

  const {
    mxc,
    upload,
    cancel: cancelUpload,
  } = useAttachmentUpload(session.hsApi, platform, useDebounce(setProgress, { wait: 200, immediate: true }));

  useEffect(() => {
    onBlobChange(avatarPrevBlob);
    setProgress(0);
    if (avatarPrevBlob) upload(avatarPrevBlob);
    else cancelUpload();
  }, [avatarPrevBlob, onBlobChange, upload, cancelUpload]);

  useEffect(() => onMxcChange(mxc), [mxc, onMxcChange]);

  const handleAvatarPrevSelect = useCallback(async () => {
    const data = await platform.openFile("image/*");
    if (!data) return;
    setAvatarPrevBlob(data.blob);
  }, [setAvatarPrevBlob, platform]);

  return (
    <SettingTile className="grow basis-0" label={<Label>Avatar Preview *</Label>}>
      <div className="flex flex-column items-start gap-xxs">
        {avatarPrevBlob ? (
          <>
            <Text variant="b3" weight="medium">
              File: {avatarPrevBlob.nativeBlob.name}
            </Text>
            <Text weight={mxc ? "regular" : "bold"} variant="b3">
              {mxc && `Size: ${bytesToSize(avatarPrevBlob.size)}`}
              {!mxc && `Uploading: ${bytesToSize(sentBytes)} / ${bytesToSize(avatarPrevBlob.size)}`}
            </Text>
            <Button onClick={() => setAvatarPrevBlob(undefined)} fill="outline">
              Clear Preview
            </Button>
          </>
        ) : (
          <>
            <Text variant="b3">Upload 3D avatar preview.</Text>
            <Button onClick={handleAvatarPrevSelect}>
              <Icon src={UploadIC} color="on-primary" />
              Upload Preview
            </Button>
          </>
        )}
      </div>
    </SettingTile>
  );
}
