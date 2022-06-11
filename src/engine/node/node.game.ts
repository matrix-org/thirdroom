import { addComponent, defineComponent, defineQuery, hasComponent } from "bitecs";

import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createTripleBufferBackedObjectBufferView,
} from "../allocator/ObjectBufferView";
import { RemotePositionalAudioEmitter } from "../audio/audio.game";
import { RemoteCamera } from "../camera/camera.game";
import { Hidden, Transform, traverse } from "../component/transform";
import { GameState } from "../GameTypes";
import { RemoteLight } from "../light/light.game";
import { RemoteMesh } from "../mesh/mesh.game";
import { Thread } from "../module/module.common";
import { getActiveScene } from "../renderer/renderer.game";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import {
  AudioNodeResourceProps,
  audioNodeSchema,
  AudioNodeTripleBuffer,
  AudioSharedNodeResource,
  NodeResourceType,
  RendererNodeResourceProps,
  rendererNodeSchema,
  RendererNodeTripleBuffer,
  RendererSharedNodeResource,
} from "./node.common";

export interface RemoteNode {
  eid: number;
  audioResourceId: ResourceId;
  rendererResourceId: ResourceId;
  audioSharedNode: AudioNodeTripleBuffer;
  rendererSharedNode: RendererNodeTripleBuffer;
  get mesh(): RemoteMesh | undefined;
  set mesh(mesh: RemoteMesh | undefined);
  get light(): RemoteLight | undefined;
  set light(light: RemoteLight | undefined);
  get camera(): RemoteCamera | undefined;
  set camera(camera: RemoteCamera | undefined);
  get audioEmitter(): RemotePositionalAudioEmitter | undefined;
  set audioEmitter(audioEmitter: RemotePositionalAudioEmitter | undefined);
  get static(): boolean;
  set static(value: boolean);
}

interface NodeProps {
  mesh?: RemoteMesh;
  light?: RemoteLight;
  camera?: RemoteCamera;
  audioEmitter?: RemotePositionalAudioEmitter;
  static?: boolean;
}

export const RemoteNodeComponent = defineComponent<Map<number, RemoteNode>>(new Map());

export function addRemoteNodeComponent(ctx: GameState, eid: number, props?: NodeProps): RemoteNode {
  const rendererNode = createObjectBufferView(rendererNodeSchema, ArrayBuffer);
  const audioNode = createObjectBufferView(audioNodeSchema, ArrayBuffer);

  const initialRendererProps: RendererNodeResourceProps = {
    mesh: props?.mesh?.resourceId || 0,
    light: props?.light?.resourceId || 0,
    camera: props?.camera?.resourceId || 0,
    static: props?.static || false,
  };

  const initialAudioProps: AudioNodeResourceProps = {
    audioEmitter: props?.audioEmitter?.resourceId || 0,
    static: props?.static || false,
  };

  rendererNode.mesh[0] = initialRendererProps.mesh;
  rendererNode.light[0] = initialRendererProps.light;
  rendererNode.camera[0] = initialRendererProps.camera;
  rendererNode.static[0] = initialRendererProps.static ? 1 : 0;

  audioNode.audioEmitter[0] = initialAudioProps.audioEmitter;
  audioNode.static[0] = initialAudioProps.static ? 1 : 0;

  const audioSharedNode = createTripleBufferBackedObjectBufferView(
    audioNodeSchema,
    audioNode,
    ctx.gameToMainTripleBufferFlags
  );

  const rendererSharedNode = createTripleBufferBackedObjectBufferView(
    rendererNodeSchema,
    rendererNode,
    ctx.gameToRenderTripleBufferFlags
  );

  const rendererResourceId = createResource<RendererSharedNodeResource>(ctx, Thread.Render, NodeResourceType, {
    initialProps: initialRendererProps,
    sharedNode: rendererSharedNode,
  });

  const audioResourceId = createResource<AudioSharedNodeResource>(ctx, Thread.Main, NodeResourceType, {
    initialProps: initialAudioProps,
    sharedNode: audioSharedNode,
  });

  let _mesh: RemoteMesh | undefined;
  let _light: RemoteLight | undefined;
  let _camera: RemoteCamera | undefined;
  let _audioEmitter: RemotePositionalAudioEmitter | undefined;

  const remoteNode: RemoteNode = {
    eid,
    audioResourceId,
    rendererResourceId,
    audioSharedNode,
    rendererSharedNode,
    get mesh() {
      return _mesh;
    },
    set mesh(mesh: RemoteMesh | undefined) {
      _mesh = mesh;
      rendererNode.mesh[0] = mesh?.resourceId || 0;
    },
    get light() {
      return _light;
    },
    set light(light: RemoteLight | undefined) {
      _light = light;
      rendererNode.light[0] = light?.resourceId || 0;
    },
    get camera() {
      return _camera;
    },
    set camera(camera: RemoteCamera | undefined) {
      _camera = camera;
      rendererNode.camera[0] = camera?.resourceId || 0;
    },
    get audioEmitter() {
      return _audioEmitter;
    },
    set audioEmitter(audioEmitter: RemotePositionalAudioEmitter | undefined) {
      _audioEmitter = audioEmitter;
      audioNode.audioEmitter[0] = audioEmitter?.resourceId || 0;
    },
    get static() {
      return !!rendererNode.static[0];
    },
    set static(value: boolean) {
      rendererNode.static[0] = value ? 1 : 0;
      audioNode.static[0] = value ? 1 : 0;
    },
  };

  addComponent(ctx.world, RemoteNodeComponent, eid);
  RemoteNodeComponent.set(eid, remoteNode);

  return remoteNode;
}

const remoteNodeQuery = defineQuery([RemoteNodeComponent]);

export function RemoteNodeSystem(ctx: GameState) {
  const entities = remoteNodeQuery(ctx.world);

  // TODO: Handle removing RemoteNodeComponent / destroying entity

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const remoteNode = RemoteNodeComponent.get(eid);

    if (!remoteNode) {
      continue;
    }

    remoteNode.rendererSharedNode.visible[0] = 0;

    if (remoteNode.audioEmitter) {
      remoteNode.audioSharedNode.enabled[0] = 0;
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
        remoteNode.rendererSharedNode.visible[0] = 1;
      }
    }
  });

  traverse(scene, (eid) => {
    if (hasComponent(ctx.world, RemoteNodeComponent, eid)) {
      const remoteNode = RemoteNodeComponent.get(eid);

      if (remoteNode && remoteNode.audioEmitter) {
        remoteNode.audioSharedNode.enabled[0] = 1;
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
      remoteNode.audioSharedNode.worldMatrix.set(Transform.worldMatrix[eid]);
      remoteNode.rendererSharedNode.worldMatrix.set(Transform.worldMatrix[eid]);
    }

    commitToObjectTripleBuffer(remoteNode.audioSharedNode);
    commitToObjectTripleBuffer(remoteNode.rendererSharedNode);
  }
}
