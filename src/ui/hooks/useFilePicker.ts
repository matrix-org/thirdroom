import { useCallback, useEffect, useState } from "react";
import { IBlobHandle, Platform } from "@thirdroom/hydrogen-view-sdk";

export interface FileData {
  blob?: IBlobHandle;
  url?: string;
  pickUsed: number;
  dropUsed: number;
}

export function useFilePicker(platform: Platform, mimeType: string) {
  const [fileData, setFileData] = useState<FileData>({
    pickUsed: 0,
    dropUsed: 0,
  });

  useEffect(() => {
    return () => {
      if (fileData.url) {
        URL.revokeObjectURL(fileData.url);
      }
    };
  }, [fileData.url]);

  const pickFile = useCallback(async () => {
    const data = await platform.openFile(mimeType);
    if (!data) return;
    setFileData((state) => ({
      blob: data.blob,
      url: URL.createObjectURL(data.blob.nativeBlob),
      pickUsed: state.pickUsed + 1,
      dropUsed: state.dropUsed,
    }));
  }, [setFileData, platform, mimeType]);

  const dropFile = useCallback(
    () => setFileData((state) => ({ pickUsed: state.pickUsed, dropUsed: state.dropUsed + 1 })),
    []
  );

  const resetUses = useCallback(
    () => ({
      pickUsed: 0,
      dropUsed: 0,
    }),
    []
  );

  return { fileData, pickFile, dropFile, resetUses };
}
