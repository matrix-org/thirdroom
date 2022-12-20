import { useState, useRef, useEffect, useCallback } from "react";
import { AttachmentUpload, HomeServerApi, IBlobHandle, Platform } from "@thirdroom/hydrogen-view-sdk";

import { uploadAttachment } from "../utils/matrixUtils";

export function useAttachmentUpload(
  hsApi: HomeServerApi,
  platform: Platform,
  onProgress?: (sentBytes: number, totalBytes: number) => void
) {
  const [mxc, setMxc] = useState<string>();
  const [error, setError] = useState<Error>();
  const attachmentRef = useRef<AttachmentUpload>();

  const upload = useCallback(
    async (blob: IBlobHandle) => {
      if (attachmentRef.current) {
        console.warn("Already uploading attachment.", blob);
        return;
      }
      try {
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
      } catch (err: any) {
        setError(err);
      }
    },
    [hsApi, platform, onProgress]
  );

  const cancel = useCallback(() => {
    attachmentRef.current?.abort();
    attachmentRef.current = undefined;
    setError(undefined);
    setMxc(undefined);
  }, []);

  useEffect(() => {
    return () => {
      attachmentRef.current?.abort();
    };
  }, []);

  return { mxc, error, upload, cancel };
}
