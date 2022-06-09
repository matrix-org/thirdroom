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

export function AvatarUpload({ onMxcChange }: { onMxcChange: (Url?: string) => void }) {
  const { session, platform } = useHydrogen(true);
  const [avatarBlob, setAvatarBlob] = useState<IBlobHandle>();
  const [sentBytes, setProgress] = useState(0);

  const {
    mxc,
    upload,
    cancel: cancelUpload,
  } = useAttachmentUpload(session.hsApi, platform, useDebounce(setProgress, { wait: 200, immediate: true }));

  useEffect(() => {
    setProgress(0);
    if (avatarBlob) upload(avatarBlob);
    else cancelUpload();
  }, [avatarBlob, upload, cancelUpload]);

  useEffect(() => onMxcChange(mxc), [mxc, onMxcChange]);

  const handleAvatarSelect = useCallback(async () => {
    const data = await platform.openFile(".glb");
    if (!data) return;
    setAvatarBlob(data.blob);
  }, [setAvatarBlob, platform]);

  return (
    <SettingTile className="grow basis-0" label={<Label>Avatar *</Label>}>
      <div className="flex flex-column items-start gap-xxs">
        {avatarBlob ? (
          <>
            <Text variant="b3" weight="medium">
              File: {avatarBlob.nativeBlob.name}
            </Text>
            <Text weight={mxc ? "regular" : "bold"} variant="b3">
              {mxc && `Size: ${bytesToSize(avatarBlob.size)}`}
              {!mxc && `Uploading: ${bytesToSize(sentBytes)} / ${bytesToSize(avatarBlob.size)}`}
            </Text>
            <Button onClick={() => setAvatarBlob(undefined)} fill="outline">
              Clear Scene
            </Button>
          </>
        ) : (
          <>
            <Text variant="b3">Upload glb 3D avatar file.</Text>
            <Button onClick={handleAvatarSelect}>
              <Icon src={UploadIC} color="on-primary" />
              Upload Avatar
            </Button>
          </>
        )}
      </div>
    </SettingTile>
  );
}
