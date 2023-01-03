import { useState, useRef, useEffect, useCallback } from "react";
import { HomeServerApi, IBlobHandle, IHomeServerRequest } from "@thirdroom/hydrogen-view-sdk";

import { uploadAttachment } from "../utils/matrixUtils";

export function useAttachmentUpload(
  hsApi: HomeServerApi,
  onProgress?: (sentBytes: number, totalBytes: number) => void
) {
  const [mxc, setMxc] = useState<string>();
  const [error, setError] = useState<Error>();
  const requestRef = useRef<IHomeServerRequest>();

  const upload = useCallback(
    async (blob: IBlobHandle) => {
      if (requestRef.current) {
        console.warn("Already uploading attachment.", blob);
        return;
      }
      try {
        const mxc = await uploadAttachment(
          hsApi,
          blob,
          (request) => {
            requestRef.current = request;
          },
          onProgress
        );

        if (!requestRef.current) return;
        setMxc(mxc);
        requestRef.current === null;
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err);
        requestRef.current === null;
      }
    },
    [hsApi, onProgress]
  );

  const cancel = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = undefined;
    setError(undefined);
    setMxc(undefined);
  }, []);

  useEffect(() => {
    return () => {
      requestRef.current?.abort();
    };
  }, []);

  return { mxc, error, upload, cancel };
}
