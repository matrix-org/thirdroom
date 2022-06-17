import { addComponent, defineQuery, hasComponent } from "bitecs";

import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { RemotePositionalAudioEmitter } from "../audio/audio.game";
import { RemoteCamera } from "../camera/camera.game";
import { Hidden, Transform, traverse } from "../component/transform";
import { GameState } from "../GameTypes";
import { RemoteLight } from "../light/light.game";
import { RemoteMesh } from "../mesh/mesh.game";
import { Thread } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { createResource } from "../resource/resource.game";
import { RemoteSceneComponent } from "../scene/scene.game";
import {
  audioNodeSchema,
  AudioNodeTripleBuffer,
  AudioSharedNodeResource,
  NodeResourceType,
  rendererNodeSchema,
  RendererNodeTripleBuffer,
  RendererSharedNodeResource,
} from "./node.common";

export type RendererNodeBufferView = ObjectBufferView<typeof rendererNodeSchema, ArrayBuffer>;
export type AudioNodeBufferView = ObjectBufferView<typeof audioNodeSchema, ArrayBuffer>;

export interface RemoteNode {
  eid: number;
  audioResourceId: ResourceId;
  rendererResourceId: ResourceId;
  rendererNodeBufferView: RendererNodeBufferView;
  audioNodeBufferView: AudioNodeBufferView;
  audioNodeTripleBuffer: AudioNodeTripleBuffer;
  rendererNodeTripleBuffer: RendererNodeTripleBuffer;
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

export const RemoteNodeComponent: Map<number, RemoteNode> = new Map();

export function addRemoteNodeComponent(ctx: GameState, eid: number, props?: NodeProps): RemoteNode {
  // if entity already has the component should we apply props and return object?
  if (hasComponent(ctx.world, RemoteNodeComponent, eid)) {
    const remoteNode = RemoteNodeComponent.get(eid)!;

    if (props?.mesh) remoteNode.mesh = props.mesh;
    if (props?.light) remoteNode.light = props.light;
    if (props?.camera) remoteNode.camera = props.camera;
    if (props?.audioEmitter) remoteNode.audioEmitter = props.audioEmitter;

    return remoteNode;
  }

  const rendererNodeBufferView = createObjectBufferView(rendererNodeSchema, ArrayBuffer);
  const audioNodeBufferView = createObjectBufferView(audioNodeSchema, ArrayBuffer);

  rendererNodeBufferView.mesh[0] = props?.mesh?.resourceId || 0;
  rendererNodeBufferView.light[0] = props?.light?.resourceId || 0;
  rendererNodeBufferView.camera[0] = props?.camera?.resourceId || 0;
  rendererNodeBufferView.static[0] = props?.static ? 1 : 0;

  audioNodeBufferView.audioEmitter[0] = props?.audioEmitter?.resourceId || 0;
  audioNodeBufferView.static[0] = props?.static ? 1 : 0;

  const audioNodeTripleBuffer = createObjectTripleBuffer(audioNodeSchema, ctx.gameToMainTripleBufferFlags);

  const rendererNodeTripleBuffer = createObjectTripleBuffer(rendererNodeSchema, ctx.gameToRenderTripleBufferFlags);

  const rendererResourceId = createResource<RendererSharedNodeResource>(ctx, Thread.Render, NodeResourceType, {
    rendererNodeTripleBuffer,
  });

  const audioResourceId = createResource<AudioSharedNodeResource>(ctx, Thread.Main, NodeResourceType, {
    audioNodeTripleBuffer,
  });

  let _mesh: RemoteMesh | undefined = props?.mesh;
  let _light: RemoteLight | undefined = props?.light;
  let _camera: RemoteCamera | undefined = props?.camera;
  let _audioEmitter: RemotePositionalAudioEmitter | undefined = props?.audioEmitter;

  const remoteNode: RemoteNode = {
    eid,
    audioResourceId,
    rendererResourceId,
    rendererNodeBufferView,
    audioNodeBufferView,
    audioNodeTripleBuffer,
    rendererNodeTripleBuffer,
    get mesh() {
      return _mesh;
    },
    set mesh(mesh: RemoteMesh | undefined) {
      _mesh = mesh;
      rendererNodeBufferView.mesh[0] = mesh?.resourceId || 0;
    },
    get light() {
      return _light;
    },
    set light(light: RemoteLight | undefined) {
      _light = light;
      rendererNodeBufferView.light[0] = light?.resourceId || 0;
    },
    get camera() {
      return _camera;
    },
    set camera(camera: RemoteCamera | undefined) {
      _camera = camera;
      rendererNodeBufferView.camera[0] = camera?.resourceId || 0;
    },
    get audioEmitter() {
      return _audioEmitter;
    },
    set audioEmitter(audioEmitter: RemotePositionalAudioEmitter | undefined) {
      _audioEmitter = audioEmitter;
      audioNodeBufferView.audioEmitter[0] = audioEmitter?.resourceId || 0;
    },
    get static() {
      return !!rendererNodeBufferView.static[0];
    },
    set static(value: boolean) {
      rendererNodeBufferView.static[0] = value ? 1 : 0;
      audioNodeBufferView.static[0] = value ? 1 : 0;
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

    remoteNode.rendererNodeBufferView.visible[0] = 0;

    if (remoteNode.audioEmitter) {
      remoteNode.audioNodeBufferView.enabled[0] = 0;
    }
  }

  const scene = ctx.activeScene;

  const sceneResource = RemoteSceneComponent.get(scene);

  if (!sceneResource) {
    return;
  }

  traverse(scene, (eid) => {
    if (hasComponent(ctx.world, Hidden, eid)) {
      return false;
    }

    if (hasComponent(ctx.world, RemoteNodeComponent, eid)) {
      const remoteNode = RemoteNodeComponent.get(eid);

      if (remoteNode) {
        remoteNode.rendererNodeBufferView.visible[0] = 1;
      }
    }
  });

  traverse(scene, (eid) => {
    if (hasComponent(ctx.world, RemoteNodeComponent, eid)) {
      const remoteNode = RemoteNodeComponent.get(eid);

      if (remoteNode && remoteNode.audioEmitter) {
        remoteNode.audioNodeBufferView.enabled[0] = 1;
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
      remoteNode.audioNodeBufferView.worldMatrix.set(Transform.worldMatrix[eid]);
      remoteNode.rendererNodeBufferView.worldMatrix.set(Transform.worldMatrix[eid]);
    }

    commitToObjectTripleBuffer(remoteNode.audioNodeTripleBuffer, remoteNode.audioNodeBufferView);
    commitToObjectTripleBuffer(remoteNode.rendererNodeTripleBuffer, remoteNode.rendererNodeBufferView);
  }
}
