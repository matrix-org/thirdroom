import { defineComponent, defineQuery, hasComponent } from "bitecs";
import { createObjectBufferView } from "../allocator/ObjectBufferView";

import { RemoteCamera } from "../camera/camera.game";
import { Transform, traverse } from "../component/transform";
import { GameState } from "../GameTypes";
import { RemoteLight } from "../light/light.game";
import { getActiveScene } from "../renderer/renderer.game";
import { ResourceId } from "../resource/resource.common";
import { audioNodeSchema, rendererNodeSchema } from "./node.common";

interface RemoteTransform {
  visible: boolean;
  interpolate: boolean;
}

interface RemoteNode {
  resourceId: ResourceId;
  transform: RemoteTransform;
  mesh?: RemoteMesh;
  light?: RemoteLight;
  camera?: RemoteCamera;
  audioEmitter?: RemoteAudioEmitter;
}

interface NodeProps {
  mesh?: RemoteMesh;
  light?: RemoteLight;
  camera?: RemoteCamera;
  audioEmitter?: RemoteAudioEmitter;
}

export function addRemoteNodeComponent(ctx: GameState, eid: number, props?: NodeProps): RemoteNode {
  const rendererNode = createObjectBufferView(rendererNodeSchema, ArrayBuffer);
  const audioNode = createObjectBufferView(audioNodeSchema, ArrayBuffer);

  const initialProps = {
    resourceId: ResourceId;
    transform: RemoteTransform;
    mesh?: RemoteMesh;
    light?: RemoteLight;
    camera?: RemoteCamera;
    audioEmitter?: RemoteAudioEmitter;
  };

  texture.offset.set(initialProps.offset);
  texture.rotation[0] = initialProps.rotation;
  texture.scale.set(initialProps.scale);

  const sharedTexture = createTripleBufferBackedObjectBufferView(
    textureSchema,
    texture,
    ctx.gameToMainTripleBufferFlags
  );

  const resourceId = createResource<SharedTextureResource>(ctx, TextureResourceType, {
    initialProps,
    sharedTexture,
  });

  const remoteTexture: RemoteTexture = {
    resourceId,
    sharedTexture,
    image,
    get offset(): vec2 {
      return texture.offset;
    },
    set offset(value: vec2) {
      texture.offset.set(value);
      texture.needsUpdate[0] = 1;
    },
    get rotation(): number {
      return texture.rotation[0];
    },
    set rotation(value: number) {
      texture.rotation[0] = value;
      texture.needsUpdate[0] = 1;
    },
    get scale(): vec2 {
      return texture.scale;
    },
    set scale(value: vec2) {
      texture.scale.set(value);
      texture.needsUpdate[0] = 1;
    },
  };

  textureModule.textures.push(remoteTexture);

  return remoteTexture;
}

export const RemoteNodeComponent = defineComponent<Map<number, RemoteNode>>(new Map());

const remoteNodeQuery = defineQuery([RemoteNodeComponent]);

export function RemoteNodeSystem(ctx: GameState) {
  const entities = remoteNodeQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const remoteNode = RemoteNodeComponent.get(eid);

    if (!remoteNode) {
      continue;
    }

    remoteNode.transform.visible = false;

    if (remoteNode.audioEmitter) {
      remoteNode.audioEmitter.enabled = false;
    }
  }

  const scene = getActiveScene(ctx);

  traverse(scene, (eid) => {
    if (hasComponent(ctx.world, Hidden, eid)) {
      return false;
    }

    if (hasComponent(ctx.world, RemoteNodeComponent, eid)) {
      const remoteNode = RemoteNodeComponent.get(eid);

      if (remoteNode) {
        remoteNode.transform.visible = true;
      }
    }
  });

  traverse(scene, (eid) => {
    if (hasComponent(ctx.world, RemoteNodeComponent, eid)) {
      const remoteNode = RemoteNodeComponent.get(eid);

      if (remoteNode && remoteNode.audioEmitter) {
        remoteNode.audioEmitter.enabled = true;
      }
    }
  });

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const remoteNode = RemoteNodeComponent.get(eid);

    if (!remoteNode) {
      continue;
    }

    if (hasComponent(ctx.world, Transform, eid)) {
      remoteNode.transform.update();
    }

    if (remoteNode.mesh) {
      remoteNode.mesh.update(ctx);
    }

    if (remoteNode.light) {
      remoteNode.light.update(ctx);
    }

    if (remoteNode.camera) {
      remoteNode.camera.update(ctx);
    }

    if (remoteNode.audioEmitter) {
      remoteNode.audioEmitter.update(ctx);
    }

    if (remoteNode.audioListener) {
      remoteNode.audioListener.update(ctx);
    }
  }
}
