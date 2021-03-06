import { useEffect, useState } from "react";
import { IBlobHandle } from "@thirdroom/hydrogen-view-sdk";

import { FileUploadCard } from "./file-upload-card/FileUploadCard";
import { useAttachmentUpload } from "../../hooks/useAttachmentUpload";
import { useDebounce } from "../../hooks/useDebounce";
import { useHydrogen } from "../../hooks/useHydrogen";
import { useFilePicker } from "../../hooks/useFilePicker";

export interface AutoUploadInfo {
  mxc?: string;
  blob?: IBlobHandle;
  url?: string;
}

interface AutoFileUploadProps {
  mimeType: string;
  onUploadInfo: (info: AutoUploadInfo) => void;
  renderButton: (pickFile: () => Promise<void>) => JSX.Element;
}

export function AutoFileUpload({ renderButton, mimeType, onUploadInfo }: AutoFileUploadProps) {
  const { session, platform } = useHydrogen(true);

  const { fileData, pickFile, dropFile } = useFilePicker(platform, mimeType);
  const [progress, setProgress] = useState(0);
  const { mxc, upload, cancel } = useAttachmentUpload(
    session.hsApi,
    platform,
    useDebounce(setProgress, { wait: 200, immediate: true })
  );
  useEffect(() => {
    if (fileData.blob) upload(fileData.blob);
    else {
      cancel();
      setProgress(0);
    }
  }, [fileData.blob, upload, cancel]);

  useEffect(() => {
    onUploadInfo({
      mxc,
      blob: fileData.blob,
      url: fileData.url,
    });
  }, [mxc, fileData.blob, fileData.url, onUploadInfo]);

  return fileData.blob ? (
    <FileUploadCard
      name={fileData.blob.nativeBlob.name}
      sentBytes={progress}
      totalBytes={fileData.blob.size}
      onUploadDrop={dropFile}
    />
  ) : (
    renderButton(pickFile)
  );
}
