import { useState, useRef, useEffect, useCallback } from "react";
import { AttachmentUpload, HomeServerApi, IBlobHandle, Platform } from "@thirdroom/hydrogen-view-sdk";

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
      const nativeBlob = blob.nativeBlob;
      const attachment = new AttachmentUpload({ filename: nativeBlob.name, blob, platform });

      attachmentRef.current = attachment;
      await attachment.upload(hsApi, () => {
        onProgress?.(attachment.sentBytes, attachment.size);
      });
      if (!attachmentRef.current) return;

      const content = {} as { url?: string };
      attachment.applyToContent("url", content);
      setMxc(content.url);
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
