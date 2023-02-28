import { addComponent, defineComponent, hasComponent } from "bitecs";
import { AnimationClip } from "three";

import { addChild, getLastSibling } from "../component/transform";
import { GameState } from "../GameTypes";
import { defineRemoteResourceClass } from "./RemoteResourceClass";
import {
  NametagResource,
  SamplerResource,
  BufferResource,
  BufferViewResource,
  AudioDataResource,
  AudioSourceResource,
  AudioEmitterResource,
  ImageResource,
  TextureResource,
  ReflectionProbeResource,
  MaterialResource,
  LightResource,
  CameraResource,
  SparseAccessorResource,
  AccessorResource,
  MeshPrimitiveResource,
  InstancedMeshResource,
  MeshResource,
  LightMapResource,
  TilesRendererResource,
  SkinResource,
  InteractableResource,
  NodeResource,
  SceneResource,
  AnimationResource,
  AnimationChannelResource,
  AnimationSamplerResource,
  WorldResource,
  EnvironmentResource,
} from "./schema";

export class RemoteNametag extends defineRemoteResourceClass(NametagResource) {}

export class RemoteSampler extends defineRemoteResourceClass(SamplerResource) {}

export class RemoteBuffer extends defineRemoteResourceClass(BufferResource) {}

export class RemoteBufferView extends defineRemoteResourceClass(BufferViewResource) {
  declare buffer: RemoteBuffer;
}

export class RemoteAudioData extends defineRemoteResourceClass(AudioDataResource) {
  declare bufferView: RemoteBufferView | undefined;
}

export class RemoteAudioSource extends defineRemoteResourceClass(AudioSourceResource) {
  declare audio: RemoteAudioData | undefined;
}

export class RemoteAudioEmitter extends defineRemoteResourceClass(AudioEmitterResource) {
  declare sources: RemoteAudioSource[];
}

export class RemoteImage extends defineRemoteResourceClass(ImageResource) {
  declare bufferView: RemoteBufferView | undefined;
}

export class RemoteTexture extends defineRemoteResourceClass(TextureResource) {
  declare sampler: RemoteSampler | undefined;
  declare source: RemoteImage;
}

export class RemoteReflectionProbe extends defineRemoteResourceClass(ReflectionProbeResource) {
  declare reflectionProbeTexture: RemoteTexture | undefined;
}

export class RemoteMaterial extends defineRemoteResourceClass(MaterialResource) {
  declare baseColorTexture: RemoteTexture | undefined;
  declare metallicRoughnessTexture: RemoteTexture | undefined;
  declare normalTexture: RemoteTexture | undefined;
  declare occlusionTexture: RemoteTexture | undefined;
  declare emissiveTexture: RemoteTexture | undefined;
  declare transmissionTexture: RemoteTexture | undefined;
  declare thicknessTexture: RemoteTexture | undefined;
}

export class RemoteLight extends defineRemoteResourceClass(LightResource) {}

export class RemoteCamera extends defineRemoteResourceClass(CameraResource) {}

export class RemoteSparseAccessor extends defineRemoteResourceClass(SparseAccessorResource) {
  declare indicesBufferView: RemoteBufferView;
  declare valuesBufferView: RemoteBufferView;
}

export class RemoteAccessor extends defineRemoteResourceClass(AccessorResource) {
  declare bufferView: RemoteBufferView | undefined;
  declare sparse: RemoteSparseAccessor | undefined;
}

export class RemoteMeshPrimitive extends defineRemoteResourceClass(MeshPrimitiveResource) {
  declare attributes: RemoteAccessor[];
  declare indices: RemoteAccessor | undefined;
  declare material: RemoteMaterial | undefined;
}

export class RemoteInstancedMesh extends defineRemoteResourceClass(InstancedMeshResource) {
  declare attributes: RemoteAccessor[];
}

export class RemoteMesh extends defineRemoteResourceClass(MeshResource) {
  declare primitives: RemoteMeshPrimitive[];
}

export class RemoteLightMap extends defineRemoteResourceClass(LightMapResource) {
  declare texture: RemoteTexture;
}

export class RemoteTilesRenderer extends defineRemoteResourceClass(TilesRendererResource) {}

export class RemoteSkin extends defineRemoteResourceClass(SkinResource) {
  declare joints: RemoteNode[];
  declare inverseBindMatrices: RemoteAccessor | undefined;
}

export class RemoteInteractable extends defineRemoteResourceClass(InteractableResource) {}

const NodeIsStaticOffset = NodeResource.schema.isStatic.byteOffset / 4;

export class RemoteNode extends defineRemoteResourceClass(NodeResource) {
  declare parentScene: RemoteScene | undefined;
  declare parent: RemoteNode | undefined;
  declare firstChild: RemoteNode | undefined;
  declare prevSibling: RemoteNode | undefined;
  declare nextSibling: RemoteNode | undefined;
  declare mesh: RemoteMesh | undefined;
  declare instancedMesh: RemoteInstancedMesh | undefined;
  declare lightMap: RemoteLightMap | undefined;
  declare skin: RemoteSkin | undefined;
  declare light: RemoteLight | undefined;
  declare reflectionProbe: RemoteReflectionProbe | undefined;
  declare camera: RemoteCamera | undefined;
  declare audioEmitter: RemoteAudioEmitter | undefined;
  declare tilesRenderer: RemoteTilesRenderer | undefined;
  declare nametag: RemoteNametag | undefined;
  declare interactable: RemoteInteractable | undefined;

  get isStatic() {
    return !this.manager.ctx.editorLoaded && this.u32View[NodeIsStaticOffset] === 1;
  }

  set isStatic(value: boolean) {
    this.u32View[NodeIsStaticOffset] = value ? 1 : 0;
  }
}

export class RemoteAnimationSampler extends defineRemoteResourceClass(AnimationSamplerResource) {
  declare input: RemoteAccessor;
  declare output: RemoteAccessor;
}

export class RemoteAnimationChannel extends defineRemoteResourceClass(AnimationChannelResource) {
  declare sampler: RemoteAnimationSampler;
  declare targetNode: RemoteNode;
}

export class RemoteAnimation extends defineRemoteResourceClass(AnimationResource) {
  declare channels: RemoteAnimationChannel[];
  declare samplers: RemoteAnimationSampler[];
  declare clip: AnimationClip | undefined;
}

export class RemoteScene extends defineRemoteResourceClass(SceneResource) {
  declare backgroundTexture: RemoteTexture | undefined;
  declare reflectionProbe: RemoteReflectionProbe | undefined;
  declare audioEmitters: RemoteAudioEmitter[];
  declare firstNode: RemoteNode | undefined;
}

export class RemoteEnvironment extends defineRemoteResourceClass(EnvironmentResource) {
  declare publicScene: RemoteScene;
  declare privateScene: RemoteScene;
}

export class RemoteWorld extends defineRemoteResourceClass(WorldResource) {
  declare environment: RemoteEnvironment | undefined;
  declare firstNode: RemoteNode | undefined;
  declare persistentScene: RemoteScene;
  declare activeCameraNode: RemoteNode | undefined;
  declare activeAvatarNode: RemoteNode | undefined;
  declare activeLeftControllerNode: RemoteNode | undefined;
  declare activeRightControllerNode: RemoteNode | undefined;
}

export const RemoteObject = defineComponent();

export function addObjectToWorld(ctx: GameState, object: RemoteNode) {
  if (!hasComponent(ctx.world, RemoteObject, object.eid)) {
    throw new Error(`Node is not a RemoteObject`);
  }

  const worldResource = ctx.worldResource;
  const firstNode = worldResource.firstNode;

  if (!firstNode) {
    worldResource.firstNode = object;
  } else {
    const lastSibling = getLastSibling(firstNode);
    lastSibling.nextSibling = object;
    object.prevSibling = lastSibling;
  }
}

export function removeObjectFromWorld(ctx: GameState, object: RemoteNode) {
  if (!hasComponent(ctx.world, RemoteObject, object.eid)) {
    throw new Error(`Node is not a RemoteObject`);
  }

  object.addRef();

  const worldResource = ctx.worldResource;
  const prevSibling = object.prevSibling;
  const nextSibling = object.nextSibling;

  if (worldResource.firstNode === object) {
    worldResource.firstNode = undefined;
  }

  // [prev, child, next]
  if (prevSibling && nextSibling) {
    prevSibling.nextSibling = nextSibling;
    nextSibling.prevSibling = prevSibling;
  }
  // [prev, child]
  if (prevSibling && !nextSibling) {
    prevSibling.nextSibling = undefined;
  }
  // [child, next]
  if (nextSibling && !prevSibling) {
    nextSibling.prevSibling = undefined;
    worldResource.firstNode = nextSibling;
  }

  object.parentScene = undefined;
  object.parent = undefined;
  object.prevSibling = undefined;
  object.nextSibling = undefined;
  object.firstChild = undefined;

  object.removeRef();
}

export function createRemoteObject(ctx: GameState, publicRoot: RemoteNode, privateRoot?: RemoteNode) {
  const root = new RemoteNode(ctx.resourceManager);
  addComponent(ctx.world, RemoteObject, root.eid);
  addChild(root, privateRoot || new RemoteNode(ctx.resourceManager, { name: "Private Root" }));
  addChild(root, publicRoot);
  return root;
}

export function getObjectPrivateRoot(root: RemoteNode): RemoteNode {
  return root.firstChild!;
}

export function getObjectPublicRoot(root: RemoteNode): RemoteNode {
  return root.firstChild!.nextSibling!;
}
