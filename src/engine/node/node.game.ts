import { addComponent, defineQuery, exitQuery, hasComponent } from "bitecs";

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
import { RemoteMesh, RemoteInstancedMesh } from "../mesh/mesh.game";
import { Thread } from "../module/module.common";
import { ResourceId } from "../resource/resource.common";
import { addResourceRef, createResource, disposeResource } from "../resource/resource.game";
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
import { RemoteTilesRenderer } from "../tiles-renderer/tiles-renderer.game";

export type RendererNodeBufferView = ObjectBufferView<typeof rendererNodeSchema, ArrayBuffer>;
export type AudioNodeBufferView = ObjectBufferView<typeof audioNodeSchema, ArrayBuffer>;

export interface RemoteNode {
  name: string;
  eid: number;
  audioResourceId: ResourceId;
  rendererResourceId: ResourceId;
  rendererNodeBufferView: RendererNodeBufferView;
  audioNodeBufferView: AudioNodeBufferView;
  audioNodeTripleBuffer: AudioNodeTripleBuffer;
  rendererNodeTripleBuffer: RendererNodeTripleBuffer;
  get mesh(): RemoteMesh | undefined;
  set mesh(mesh: RemoteMesh | undefined);
  get instancedMesh(): RemoteInstancedMesh | undefined;
  set instancedMesh(instancedMesh: RemoteInstancedMesh | undefined);
  get light(): RemoteLight | undefined;
  set light(light: RemoteLight | undefined);
  get camera(): RemoteCamera | undefined;
  set camera(camera: RemoteCamera | undefined);
  get tilesRenderer(): RemoteTilesRenderer | undefined;
  set tilesRenderer(tilesRenderer: RemoteTilesRenderer | undefined);
  get audioEmitter(): RemotePositionalAudioEmitter | undefined;
  set audioEmitter(audioEmitter: RemotePositionalAudioEmitter | undefined);
  get static(): boolean;
  set static(value: boolean);
}

const DEFAULT_NODE_NAME = "Node";

interface NodeProps {
  name?: string;
  mesh?: RemoteMesh;
  instancedMesh?: RemoteInstancedMesh;
  light?: RemoteLight;
  camera?: RemoteCamera;
  audioEmitter?: RemotePositionalAudioEmitter;
  tilesRenderer?: RemoteTilesRenderer;
  static?: boolean;
}

export const RemoteNodeComponent: Map<number, RemoteNode> = new Map();

export function addRemoteNodeComponent(ctx: GameState, eid: number, props?: NodeProps): RemoteNode {
  // if entity already has the component should we apply props and return object?
  if (hasComponent(ctx.world, RemoteNodeComponent, eid)) {
    const remoteNode = RemoteNodeComponent.get(eid)!;

    if (props?.mesh) remoteNode.mesh = props.mesh;
    if (props?.instancedMesh) remoteNode.instancedMesh = props.instancedMesh;
    if (props?.light) remoteNode.light = props.light;
    if (props?.camera) remoteNode.camera = props.camera;
    if (props?.audioEmitter) remoteNode.audioEmitter = props.audioEmitter;
    if (props?.tilesRenderer) remoteNode.tilesRenderer = props.tilesRenderer;

    return remoteNode;
  }

  const rendererNodeBufferView = createObjectBufferView(rendererNodeSchema, ArrayBuffer);
  const audioNodeBufferView = createObjectBufferView(audioNodeSchema, ArrayBuffer);

  rendererNodeBufferView.mesh[0] = props?.mesh?.resourceId || 0;
  rendererNodeBufferView.instancedMesh[0] = props?.instancedMesh?.resourceId || 0;
  rendererNodeBufferView.light[0] = props?.light?.resourceId || 0;
  rendererNodeBufferView.camera[0] = props?.camera?.resourceId || 0;
  rendererNodeBufferView.tilesRenderer[0] = props?.tilesRenderer?.resourceId || 0;
  rendererNodeBufferView.static[0] = props?.static ? 1 : 0;

  audioNodeBufferView.audioEmitter[0] = props?.audioEmitter?.resourceId || 0;
  audioNodeBufferView.static[0] = props?.static ? 1 : 0;

  const audioNodeTripleBuffer = createObjectTripleBuffer(audioNodeSchema, ctx.gameToMainTripleBufferFlags);

  const rendererNodeTripleBuffer = createObjectTripleBuffer(rendererNodeSchema, ctx.gameToRenderTripleBufferFlags);

  let _mesh: RemoteMesh | undefined = props?.mesh;
  let _instancedMesh: RemoteInstancedMesh | undefined = props?.instancedMesh;
  let _light: RemoteLight | undefined = props?.light;
  let _camera: RemoteCamera | undefined = props?.camera;
  let _audioEmitter: RemotePositionalAudioEmitter | undefined = props?.audioEmitter;
  let _tilesRenderer: RemoteTilesRenderer | undefined = props?.tilesRenderer;

  const name = props?.name || DEFAULT_NODE_NAME;

  const rendererResourceId = createResource<RendererSharedNodeResource>(
    ctx,
    Thread.Render,
    NodeResourceType,
    {
      rendererNodeTripleBuffer,
    },
    {
      name,
      dispose() {
        if (_mesh) {
          disposeResource(ctx, _mesh.resourceId);
        }

        if (_instancedMesh) {
          disposeResource(ctx, _instancedMesh.resourceId);
        }

        if (_light) {
          disposeResource(ctx, _light.resourceId);
        }

        if (_camera) {
          disposeResource(ctx, _camera.resourceId);
        }

        if (_tilesRenderer) {
          disposeResource(ctx, _tilesRenderer.resourceId);
        }
      },
    }
  );

  const audioResourceId = createResource<AudioSharedNodeResource>(
    ctx,
    Thread.Main,
    NodeResourceType,
    {
      audioNodeTripleBuffer,
    },
    {
      name,
      dispose() {
        if (_audioEmitter) {
          disposeResource(ctx, _audioEmitter.resourceId);
        }
      },
    }
  );

  if (_mesh) {
    addResourceRef(ctx, _mesh.resourceId);
  }

  if (_instancedMesh) {
    addResourceRef(ctx, _instancedMesh.resourceId);
  }

  if (_light) {
    addResourceRef(ctx, _light.resourceId);
  }

  if (_camera) {
    addResourceRef(ctx, _camera.resourceId);
  }

  if (_audioEmitter) {
    addResourceRef(ctx, _audioEmitter.resourceId);
  }

  if (_tilesRenderer) {
    addResourceRef(ctx, _tilesRenderer.resourceId);
  }

  const remoteNode: RemoteNode = {
    name,
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
      if (mesh) {
        addResourceRef(ctx, mesh.resourceId);
      }

      if (_mesh) {
        disposeResource(ctx, _mesh.resourceId);
      }

      _mesh = mesh;
      rendererNodeBufferView.mesh[0] = mesh?.resourceId || 0;
    },
    get instancedMesh() {
      return _instancedMesh;
    },
    set instancedMesh(instancedMesh: RemoteInstancedMesh | undefined) {
      if (instancedMesh) {
        addResourceRef(ctx, instancedMesh.resourceId);
      }

      if (_instancedMesh) {
        disposeResource(ctx, _instancedMesh.resourceId);
      }

      _instancedMesh = instancedMesh;
      rendererNodeBufferView.instancedMesh[0] = instancedMesh?.resourceId || 0;
    },
    get light() {
      return _light;
    },
    set light(light: RemoteLight | undefined) {
      if (light) {
        addResourceRef(ctx, light.resourceId);
      }

      if (_light) {
        disposeResource(ctx, _light.resourceId);
      }

      _light = light;
      rendererNodeBufferView.light[0] = light?.resourceId || 0;
    },
    get camera() {
      return _camera;
    },
    set camera(camera: RemoteCamera | undefined) {
      if (camera) {
        addResourceRef(ctx, camera.resourceId);
      }

      if (_camera) {
        disposeResource(ctx, _camera.resourceId);
      }

      _camera = camera;
      rendererNodeBufferView.camera[0] = camera?.resourceId || 0;
    },
    get tilesRenderer() {
      return _tilesRenderer;
    },
    set tilesRenderer(tilesRenderer: RemoteTilesRenderer | undefined) {
      if (tilesRenderer) {
        addResourceRef(ctx, tilesRenderer.resourceId);
      }

      if (_tilesRenderer) {
        disposeResource(ctx, _tilesRenderer.resourceId);
      }

      _tilesRenderer = tilesRenderer;
      rendererNodeBufferView.tilesRenderer[0] = tilesRenderer?.resourceId || 0;
    },
    get audioEmitter() {
      return _audioEmitter;
    },
    set audioEmitter(audioEmitter: RemotePositionalAudioEmitter | undefined) {
      if (audioEmitter) {
        addResourceRef(ctx, audioEmitter.resourceId);
      }

      if (_audioEmitter) {
        disposeResource(ctx, _audioEmitter.resourceId);
      }

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
const remoteNodeExitQuery = exitQuery(remoteNodeQuery);

export function RemoteNodeSystem(ctx: GameState) {
  const entities = remoteNodeQuery(ctx.world);

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

  if (sceneResource) {
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

  const disposedEntities = remoteNodeExitQuery(ctx.world);

  for (let i = 0; i < disposedEntities.length; i++) {
    const eid = disposedEntities[i];

    const remoteNode = RemoteNodeComponent.get(eid);

    if (remoteNode) {
      disposeResource(ctx, remoteNode.rendererResourceId);
      disposeResource(ctx, remoteNode.audioResourceId);
      RemoteNodeComponent.delete(eid);
    }
  }
}
