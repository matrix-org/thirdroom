import { useEffect, useState, ReactNode } from "react";
import { IBlobHandle } from "@thirdroom/hydrogen-view-sdk";

import { Button, ButtonVariant, ButtonFill, ButtonSize } from "../../atoms/button/Button";
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

interface AutoUploadButtonProps {
  variant?: ButtonVariant;
  fill?: ButtonFill;
  size?: ButtonSize;
  mimeType: string;
  onUploadInfo: (info: AutoUploadInfo) => void;
  children: ReactNode;
}

export function AutoUploadButton({ variant, fill, size, mimeType, onUploadInfo, children }: AutoUploadButtonProps) {
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
    else cancel();
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
    <Button variant={variant} fill={fill} size={size} onClick={pickFile}>
      {children}
    </Button>
  );
}
