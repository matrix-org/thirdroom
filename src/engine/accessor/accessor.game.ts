import { RemoteBufferView, RemoteSharedBufferView } from "../bufferView/bufferView.game";
import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { createResource } from "../resource/resource.game";
import {
  AccessorComponentType,
  AccessorResourceProps,
  AccessorResourceType,
  AccessorSparseIndicesComponentType,
  AccessorType,
} from "./accessor.common";

export interface RemoteAccessor<
  B extends RemoteBufferView<Thread.Render> | RemoteSharedBufferView<Thread.Render> | undefined,
  S extends AccessorSparseProps | undefined
> {
  resourceId: number;
  bufferView: B;
  sparse: S extends AccessorSparseProps
    ? {
        indices: {
          bufferView: RemoteBufferView<Thread.Render>;
        };
        values: {
          bufferView: RemoteBufferView<Thread.Render>;
        };
      }
    : undefined;
}

interface AccessorSparseIndicesProps {
  bufferView: RemoteBufferView<Thread.Render> | RemoteSharedBufferView<Thread.Render>;
  byteOffset?: number;
  componentType: AccessorSparseIndicesComponentType;
}

interface AccessorSparseValuesProps {
  bufferView: RemoteBufferView<Thread.Render> | RemoteSharedBufferView<Thread.Render>;
  byteOffset?: number;
}

interface AccessorSparseProps {
  count: number;
  indices: AccessorSparseIndicesProps;
  values: AccessorSparseValuesProps;
}

interface AccessorProps<
  B extends RemoteBufferView<Thread.Render> | RemoteSharedBufferView<Thread.Render> | undefined,
  S extends AccessorSparseProps | undefined
> {
  type: AccessorType;
  componentType: AccessorComponentType;
  bufferView: B;
  count: number;
  byteOffset?: number;
  normalized?: boolean;
  min?: number;
  max?: number;
  sparse?: S;
}

export function createRemoteAccessor<
  B extends RemoteBufferView<Thread.Render> | RemoteSharedBufferView<Thread.Render> | undefined,
  S extends AccessorSparseProps | undefined
>(ctx: GameState, props: AccessorProps<B, S>): RemoteAccessor<B, S> {
  const resourceId = createResource<AccessorResourceProps>(ctx, Thread.Render, AccessorResourceType, {
    type: props.type,
    componentType: props.componentType,
    bufferView: props.bufferView ? props.bufferView.resourceId : undefined,
    count: props.count,
    byteOffset: props.byteOffset || 0,
    normalized: props.normalized || false,
    min: props.min,
    max: props.max,
    sparse: props.sparse
      ? {
          count: props.sparse.count,
          indices: {
            bufferView: props.sparse.indices.bufferView.resourceId,
            byteOffset: props.sparse.indices.byteOffset || 0,
            componentType: props.sparse.indices.componentType,
          },
          values: {
            bufferView: props.sparse.indices.bufferView.resourceId,
            byteOffset: props.sparse.indices.byteOffset || 0,
          },
        }
      : undefined,
  });

  return {
    resourceId,
    bufferView: props.bufferView,
    sparse: props.sparse
      ? {
          indices: {
            bufferView: props.sparse.indices.bufferView,
          },
          values: {
            bufferView: props.sparse.values.bufferView,
          },
        }
      : undefined,
  } as RemoteAccessor<B, S>;
}
