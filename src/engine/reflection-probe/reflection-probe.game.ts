import { vec3 } from "gl-matrix";

import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { addResourceRef, createResource, disposeResource } from "../resource/resource.game";
import { RemoteTexture } from "../resource/schema";
import { ReflectionProbeResourceType, SharedReflectionProbeResource } from "./reflection-probe.common";

export interface RemoteReflectionProbe {
  name: string;
  resourceId: ResourceId;
  get reflectionProbeTexture(): RemoteTexture;
  get size(): vec3 | undefined;
}

export interface ReflectionProbeProps {
  name?: string;
  reflectionProbeTexture: RemoteTexture;
  size?: vec3;
}

const DEFAULT_REFLECTION_PROBE_NAME = "Reflection Probe";

export function createReflectionProbeResource(ctx: GameState, props: ReflectionProbeProps): RemoteReflectionProbe {
  const name = props?.name || DEFAULT_REFLECTION_PROBE_NAME;

  const reflectionProbeTexture = props.reflectionProbeTexture;
  const reflectionProbeTextureResourceId = reflectionProbeTexture.resourceId;
  const size = props.size;

  addResourceRef(ctx, reflectionProbeTextureResourceId);

  const resourceId = createResource<SharedReflectionProbeResource>(
    ctx,
    Thread.Render,
    ReflectionProbeResourceType,
    {
      reflectionProbeTexture: reflectionProbeTextureResourceId,
      size: props.size,
    },
    {
      name,
      dispose() {
        disposeResource(ctx, reflectionProbeTextureResourceId);
      },
    }
  );

  return {
    name,
    resourceId,
    get size(): vec3 | undefined {
      return size;
    },
    get reflectionProbeTexture(): RemoteTexture {
      return reflectionProbeTexture;
    },
  };
}
