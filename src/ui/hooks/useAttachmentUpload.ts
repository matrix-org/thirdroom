import { useState, useRef, useEffect, useCallback } from "react";
import { AttachmentUpload, HomeServerApi, IBlobHandle, Platform } from "@thirdroom/hydrogen-view-sdk";

import { uploadAttachment } from "../utils/matrixUtils";

export function useAttachmentUpload(
  hsApi: HomeServerApi,
  platform: Platform,
  onProgress?: (sentBytes: number, totalBytes: number) => void
) {
  const [mxc, setMxc] = useState<string>();
  const attachmentRef = useRef<AttachmentUpload>();

  const upload = useCallback(
    async (blob: IBlobHandle) => {
      if (attachmentRef.current) {
        console.warn("Already uploading attachment.", blob);
        return;
      }
      const mxc = await uploadAttachment(
        hsApi,
        platform,
        blob,
        (attachment) => {
          attachmentRef.current = attachment;
        },
        onProgress
      );

      if (!attachmentRef.current) return;
      setMxc(mxc);
      attachmentRef.current === null;
    },
    [hsApi, platform, onProgress]
  );

  const cancel = useCallback(() => {
    attachmentRef.current?.abort();
    attachmentRef.current = undefined;
    setMxc(undefined);
  }, []);

  useEffect(() => {
    return () => {
      attachmentRef.current?.abort();
    };
  }, []);

  return { mxc, upload, cancel };
}
