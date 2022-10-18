import { DragEvent, useCallback, useState } from "react";

import { transformGLTFWeb } from "../../../asset-pipeline/web";
import { Text } from "../../atoms/text/Text";
import "./AssetPipeline.css";

export default function AssetPipeline() {
  const [{ step, status, error }, setState] = useState<{ step?: string; status?: string; error?: string }>({
    step: "Drag and drop .gltf directory contents onto this page to optimize.",
  });

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
      transformGLTFWeb(url, fileMap, ({ step, status }) => {
        setState({
          step,
          status,
        });
      }).catch((error) => {
        console.error(error);
        setState({ error: error.message });
      });
    }
  }, []);

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div className="AssetPipeline">
      <div className="AssetPipeline__dropzone" onDrop={onDropFile} onDragOver={onDragOver} />
      <div className="AssetPipeline__message">
        {error ? (
          <>
            <Text color="danger">{error}</Text>
            <Text color="danger">See console for more details.</Text>
          </>
        ) : (
          <>
            <Text color="world">{step}</Text>
            {status && <Text color="world">{status}</Text>}
          </>
        )}
      </div>
    </div>
  );
}
