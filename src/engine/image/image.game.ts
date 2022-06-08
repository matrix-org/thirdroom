import { GameState } from "../GameTypes";
import { ImageResourceProps, ImageResourceType } from "./image.common";
import { createResource } from "../resource/resource.game";
import { RemoteBufferView } from "../bufferView/bufferView.game";
import { Thread } from "../module/module.common";

export interface RemoteImage {
  resourceId: number;
  uri?: string;
  bufferView?: RemoteBufferView<Thread.Render>;
}

export function createRemoteImageFromBufferView(
  ctx: GameState,
  bufferView: RemoteBufferView<Thread.Render>,
  mimeType: string
): RemoteImage {
  return {
    resourceId: createResource<ImageResourceProps>(ctx, Thread.Render, ImageResourceType, {
      bufferView: bufferView.resourceId,
      mimeType,
    }),
    bufferView,
  };
}

export function createRemoteImage(ctx: GameState, uri: string): RemoteImage {
  return { resourceId: createResource<ImageResourceProps>(ctx, Thread.Render, ImageResourceType, { uri }) };
}
