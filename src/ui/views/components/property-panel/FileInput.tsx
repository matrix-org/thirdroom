import { Platform } from "@thirdroom/hydrogen-view-sdk";
import { useEffect } from "react";

import { Text } from "../../../atoms/text/Text";
import { useFilePicker } from "../../../hooks/useFilePicker";
import "./FileInput.css";

interface FileInputProps {
  defaultLabel?: string;
  onChange?: (blob?: Blob) => void;
  platform: Platform;
  mimeType: string;
  disabled?: boolean;
}

export function FileInput({ defaultLabel, onChange, platform, mimeType, disabled }: FileInputProps) {
  const { fileData, pickFile } = useFilePicker(platform, mimeType);
  const nativeBlob = fileData.blob?.nativeBlob;

  useEffect(() => {
    onChange?.(nativeBlob);
  }, [nativeBlob, onChange]);

  return (
    <button className="FileInput" onClick={pickFile} disabled={disabled}>
      <Text className="grow truncate" variant="b3">
        {nativeBlob?.name ?? defaultLabel ?? "Select File"}
      </Text>
    </button>
  );
}
