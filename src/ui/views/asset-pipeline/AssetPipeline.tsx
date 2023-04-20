import { DragEvent, useCallback, useState } from "react";

import { AssetPipelineOptions, DefaultAssetPipelineOptions } from "../../../asset-pipeline/pipeline";
import { transformGLTFWeb } from "../../../asset-pipeline/web";
import { Switch } from "../../atoms/button/Switch";
import { Label } from "../../atoms/text/Label";
import { Text } from "../../atoms/text/Text";
import { SettingTile } from "../components/setting-tile/SettingTile";
import "./AssetPipeline.css";

export default function AssetPipeline() {
  const [{ step, status, error }, setState] = useState<{ step?: string; status?: string; error?: string }>({
    step: "Drag and drop .gltf directory contents onto this page to optimize.",
  });

  const [options, setOptions] = useState<Required<AssetPipelineOptions>>(
    DefaultAssetPipelineOptions as Required<AssetPipelineOptions>
  );

  const onDropFile = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
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
        transformGLTFWeb(url, fileMap, options, ({ step, status }) => {
          setState({
            step,
            status,
          });
        }).catch((error) => {
          console.error(error);
          setState({ error: error.message });
        });
      }
    },
    [options]
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div className="AssetPipeline">
      <div className="AssetPipeline__dropzone" onDrop={onDropFile} onDragOver={onDragOver} />
      <div className="AssetPipeline__content gap-lg">
        <Text variant="h2">Third Room Asset Pipeline</Text>
        {Object.keys(DefaultAssetPipelineOptions).map((key) => (
          <SettingTile label={<Label>{key}</Label>}>
            <Switch
              checked={options[key as keyof AssetPipelineOptions]}
              onCheckedChange={(value) => setOptions((prev) => ({ ...prev, [key]: value }))}
            />
          </SettingTile>
        ))}
        <div className="AssetPipeline__message">
          {error ? (
            <>
              <Text color="danger">{error}</Text>
              <Text color="danger">See console for more details.</Text>
            </>
          ) : (
            <>
              <Text>{step}</Text>
              {status && <Text>{status}</Text>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
