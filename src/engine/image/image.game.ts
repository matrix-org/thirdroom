import { GameState } from "../GameTypes";
import { ImageResourceProps, ImageResourceType } from "./image.common";
import { addResourceRef, createResource, disposeResource } from "../resource/resource.game";
import { Thread } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { RemoteBufferView } from "../resource/schema";

export interface RemoteImage {
  name: string;
  resourceId: ResourceId;
  uri?: string;
  bufferView?: RemoteBufferView;
  mimeType?: string;
  flipY: boolean;
}

export interface BufferViewRemoteImageProps {
  name?: string;
  bufferView: RemoteBufferView;
  mimeType: string;
  flipY?: boolean;
}

export interface RemoteImageProps {
  name?: string;
  uri: string;
  flipY?: boolean;
}

const DEFAULT_IMAGE_NAME = "Image";

export function createRemoteImageFromBufferView(ctx: GameState, props: BufferViewRemoteImageProps): RemoteImage {
  const name = props.name || DEFAULT_IMAGE_NAME;
  const bufferViewResourceId = props.bufferView.resourceId;

  addResourceRef(ctx, bufferViewResourceId);

  return {
    name,
    resourceId: createResource<ImageResourceProps>(
      ctx,
      Thread.Render,
      ImageResourceType,
      {
        bufferView: bufferViewResourceId,
        mimeType: props.mimeType,
        flipY: props.flipY,
      },
      {
        name,
        dispose() {
          disposeResource(ctx, bufferViewResourceId);
        },
      }
    ),
    bufferView: props.bufferView,
    mimeType: props.mimeType,
    flipY: props.flipY || false,
  };
}

export function createRemoteImage(ctx: GameState, props: RemoteImageProps): RemoteImage {
  const name = props.name || DEFAULT_IMAGE_NAME;

  return {
    name,
    resourceId: createResource<ImageResourceProps>(
      ctx,
      Thread.Render,
      ImageResourceType,
      { uri: props.uri, flipY: props.flipY },
      {
        name,
      }
    ),
    flipY: props.flipY || false,
  };
}
