import { ImageBitmapLoader } from "three";

import { defineModule, getModule } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { ResourceId } from "../resource/resource.common";
import { registerResourceLoader } from "../resource/resource.render";
import { ImageResourceProps, ImageResourceType } from "./image.common";

interface ImageModuleState {
  imageBitmapLoader: ImageBitmapLoader;
}

export const ImageModule = defineModule<RenderThreadState, ImageModuleState>({
  name: "image",
  create() {
    return {
      imageBitmapLoader: new ImageBitmapLoader(),
    };
  },
  init(ctx) {
    const disposables = [registerResourceLoader(ctx, ImageResourceType, onLoadImage)];

    return () => {
      for (const dispose of disposables) {
        dispose();
      }
    };
  },
});

async function onLoadImage(ctx: RenderThreadState, id: ResourceId, props: ImageResourceProps): Promise<ImageBitmap> {
  const { imageBitmapLoader } = getModule(ctx, ImageModule);

  if (props.image) {
    return props.image;
  }

  const image = await imageBitmapLoader.loadAsync(props.uri);

  return image;
}
