import { useEffect, useState } from "react";
import { IBlobHandle } from "@thirdroom/hydrogen-view-sdk";

import { FileUploadCard, FileUploadErrorCard } from "./file-upload-card/FileUploadCard";
import { useAttachmentUpload } from "../../hooks/useAttachmentUpload";
import { useHydrogen } from "../../hooks/useHydrogen";
import { useFilePicker } from "../../hooks/useFilePicker";
import { useThrottle } from "../../hooks/useThrottle";

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
  const throttledSetProgress = useThrottle(setProgress, 16);
  const { mxc, error, upload, cancel } = useAttachmentUpload(session.hsApi, throttledSetProgress);
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

  if (error) {
    return <FileUploadErrorCard name={error.name} message={error.message} onUploadDrop={dropFile} />;
  }

  return fileData.blob ? (
    <FileUploadCard
      name={fileData.blob.nativeBlob.name}
      sentBytes={mxc ? fileData.blob.size : progress}
      totalBytes={fileData.blob.size}
      onUploadDrop={dropFile}
    />
  ) : (
    renderButton(pickFile)
  );
}
