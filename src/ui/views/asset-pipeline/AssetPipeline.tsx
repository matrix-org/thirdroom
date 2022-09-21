import { DragEvent, useCallback } from "react";

import { transformGLTFWeb } from "../../../asset-pipeline/web";
import "./AssetPipeline.css";

export default function AssetPipeline() {
  const onDropFile = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!e.dataTransfer) {
      return;
    }

    let url: string | undefined = undefined;
    const fileMap: Map<string, string> = new Map();

    for (const item of e.dataTransfer.items) {
      const file = item.getAsFile();

      if (file) {
        const fileUrl = URL.createObjectURL(file);

        if (file.name.match(/\.gl(?:tf|b)$/)) {
          url = fileUrl;
        } else {
          fileMap.set(file.name, fileUrl);
        }
      }
    }

    if (url) {
      transformGLTFWeb(url, fileMap);
    }
  }, []);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div className="AssetPipeline">
      <div className="AssetPipeline__dropzone" onDrop={onDropFile} onDragOver={onDragOver} />
    </div>
  );
}
