import { addComponent, addEntity } from "bitecs";
import { mat4, vec2 } from "gl-matrix";
import { AnimationMixer, Bone, Group, Object3D, SkinnedMesh } from "three";

import { createRemoteAccessor, RemoteAccessor } from "../accessor/accessor.game";
import { RemoteAudioData, RemoteAudioEmitter, RemoteAudioSource } from "../audio/audio.game";
import { addNameComponent } from "../component/Name";
import { SpawnPoint } from "../component/SpawnPoint";
import {
  addChild,
  addTransformComponent,
  setEulerFromQuaternion,
  Transform,
  updateMatrixWorld,
} from "../component/transform";
import { GameState } from "../GameTypes";
import {
  createRemoteInstancedMesh,
  createRemoteLightMap,
  createRemoteMesh,
  createRemoteSkinnedMesh,
  MeshPrimitiveProps,
  RemoteInstancedMesh,
  RemoteLightMap,
  RemoteMesh,
  RemoteSkinnedMesh,
} from "../mesh/mesh.game";
import { addRemoteNodeComponent, RemoteNodeComponent } from "../node/node.game";
import { addRemoteSceneComponent } from "../scene/scene.game";
import { promiseObject } from "../utils/promiseObject";
import resolveURL from "../utils/resolveURL";
import { GLTFRoot, GLTFMeshPrimitive, GLTFInstancedMeshExtension, GLTFNode, GLTFLightmapExtension } from "./GLTF";
import { hasHubsComponentsExtension, inflateHubsNode, inflateHubsScene } from "./MOZ_hubs_components";
import { hasCharacterControllerExtension, inflateSceneCharacterController } from "./MX_character_controller";
import { hasSpawnPointExtension } from "./MX_spawn_point";
import { addTilesRenderer, hasTilesRendererExtension } from "./MX_tiles_renderer";
import { RemoteNode } from "../node/node.game";
import { addAnimationComponent, BoneComponent } from "../animation/animation.game";
import { loadGLTFAnimationClip } from "./animation.three";
import {
  addCollider,
  addTrimesh,
  getColliderMesh,
  hasColliderExtension,
  hasMeshCollider,
  nodeHasCollider,
} from "./OMI_collider";
import { hasReflectionProbeExtension, loadGLTFReflectionProbe } from "./MX_reflection_probes";
import { RemoteReflectionProbe } from "../reflection-probe/reflection-probe.game";
import { hasBackgroundExtension, loadGLTFBackgroundTexture } from "./MX_background";
import { getEmissiveStrength } from "./KHR_materials_emissive_strength";
import { getTransmissionFactor, getTransmissionTextureInfo } from "./KHR_materials_transmission";
import { getThicknessTextureInfo, getVolumeMaterialProperties } from "./KHR_materials_volume";
import { getMaterialIOR } from "./KHR_materials_ior";
import { loadNodeAudioEmitter, loadSceneAudioEmitters } from "./KHR_audio";
import { hasBasisuExtension, loadBasisuImage } from "./KHR_texture_basisu";
import { inflatePortalComponent } from "./OMI_link";
import { fetchWithProgress } from "../utils/fetchWithProgress.game";
import {
  AccessorType,
  AudioEmitterOutput,
  BufferResource,
  BufferViewResource,
  CameraResource,
  CameraType,
  ImageResource,
  LightResource,
  LightType,
  MaterialAlphaMode,
  MaterialResource,
  MaterialType,
  RemoteBuffer,
  RemoteBufferView,
  RemoteCamera,
  RemoteImage,
  RemoteLight,
  RemoteMaterial,
  RemoteSampler,
  RemoteTexture,
  SamplerMapping,
  SamplerResource,
  TextureEncoding,
  TextureResource,
  NodeResource as ScriptNodeResource,
  MeshResource as ScriptMeshResource,
  MeshPrimitiveResource as ScriptMeshPrimitiveResource,
  RemoteMeshPrimitive as ScriptRemoteMeshPrimitive,
} from "../resource/schema";
import { IRemoteResourceManager } from "../resource/ResourceDefinition";
import { toSharedArrayBuffer } from "../utils/arraybuffer";
import { getPostprocessingBloomStrength } from "./MX_postprocessing";

export interface GLTFResource {
  url: string;
  baseUrl: string;
  fileMap: Map<string, string>;
  root: GLTFRoot;
  binaryChunk?: SharedArrayBuffer;
  cameras: Map<number, RemoteCamera>;
  accessors: Map<number, RemoteAccessor<any>>;
  bufferViews: Map<number, RemoteBufferView>;
  buffers: Map<number, RemoteBuffer>;
  meshes: Map<number, RemoteMesh>;
  skins: Map<number, RemoteSkinnedMesh>;
  joints: Map<number, RemoteNode>;
  lights: Map<number, RemoteLight>;
  reflectionProbes: Map<number, RemoteReflectionProbe>;
  images: Map<number, RemoteImage>;
  textures: Map<number, RemoteTexture>;
  samplers: Map<number, RemoteSampler>;
  materials: Map<number, RemoteMaterial>;
  audio: Map<number, RemoteAudioData>;
  audioSources: Map<number, RemoteAudioSource>;
  audioEmitters: Map<number, RemoteAudioEmitter>;
  cameraPromises: Map<number, Promise<RemoteCamera>>;
  accessorPromises: Map<number, Promise<RemoteAccessor<any>>>;
  bufferViewPromises: Map<number, Promise<RemoteBufferView>>;
  bufferPromises: Map<number, Promise<RemoteBuffer>>;
  meshPromises: Map<number, Promise<RemoteMesh>>;
  skinPromises: Map<number, Promise<RemoteSkinnedMesh>>;
  lightPromises: Map<number, Promise<RemoteLight>>;
  reflectionProbePromises: Map<number, Promise<RemoteReflectionProbe>>;
  imagePromises: Map<number, Promise<RemoteImage>>;
  texturePromises: Map<number, Promise<RemoteTexture>>;
  samplerPromises: Map<number, Promise<RemoteSampler>>;
  materialPromises: Map<number, Promise<RemoteMaterial>>;
  audioPromises: Map<number, Promise<RemoteAudioData>>;
  audioSourcePromises: Map<number, Promise<RemoteAudioSource>>;
  audioEmitterPromises: Map<number, { output: AudioEmitterOutput; promise: Promise<RemoteAudioEmitter> }>;
  manager: IRemoteResourceManager;
}

export function createGLTFEntity(ctx: GameState, uri: string, options: GLTFSceneOptions) {
  const eid = addEntity(ctx.world);
  inflateGLTFScene(ctx, eid, uri, options);
  return eid;
}

interface GLTFSceneOptions {
  fileMap?: Map<string, string>;
  sceneIndex?: number;
  // TODO: temporary hack for spawning avatars without static trimesh
  createTrimesh?: boolean;
  isStatic?: boolean;
  resourceManager?: IRemoteResourceManager;
}

export async function inflateGLTFScene(
  ctx: GameState,
  sceneEid: number,
  uri: string,
  { fileMap, sceneIndex, createTrimesh = true, isStatic, resourceManager }: GLTFSceneOptions = {}
): Promise<GLTFResource> {
  addTransformComponent(ctx.world, sceneEid);

  const _resourceManager = resourceManager || ctx.resourceManager;

  const resource = await loadGLTFResource(ctx, _resourceManager, uri, fileMap);

  if (sceneIndex === undefined) {
    sceneIndex = resource.root.scene;
  }

  if (sceneIndex === undefined || !resource.root.scenes || !resource.root.scenes[sceneIndex]) {
    throw new Error(`Scene ${sceneIndex} not found`);
  }

  const hasInstancedMeshExtension =
    resource.root.extensionsUsed && resource.root.extensionsUsed.includes("EXT_mesh_gpu_instancing");

  const scene = resource.root.scenes[sceneIndex];

  // animation pre-processing
  if (resource.root.skins && resource.root.nodes) {
    // iterate skins and pre-create entities and resources for joints so bones are available at the creation of the skinnedmesh
    for (const skin of resource.root.skins) {
      for (const jointIndex of skin.joints) {
        let remoteNode = resource.joints.get(jointIndex);
        if (!remoteNode) {
          const eid = addEntity(ctx.world);
          remoteNode = addRemoteNodeComponent(ctx, eid);
          resource.joints.set(jointIndex, remoteNode);
        }
      }
    }
  }

  addNameComponent(ctx.world, sceneEid, scene.name || `Scene ${sceneIndex}`);

  const group = new Group();
  const indexToObject3D = new Map<number, Object3D>();
  indexToObject3D.set(sceneIndex, group);
  const eidToObject3D = new Map<number, Object3D>();
  eidToObject3D.set(sceneEid, group);

  const nodeInflators: Function[] = [];

  let nodePromise: Promise<void[]> | undefined;

  if (scene.nodes) {
    nodePromise = Promise.all(
      scene.nodes.map((nodeIndex) =>
        _inflateGLTFNode(
          ctx,
          resource,
          eidToObject3D,
          indexToObject3D,
          nodeInflators,
          nodeIndex,
          sceneEid,
          createTrimesh && !hasInstancedMeshExtension && !hasColliderExtension(resource.root),
          isStatic
        )
      )
    );
  }

  const { audioEmitters, backgroundTexture, reflectionProbe } = await promiseObject({
    nodePromise,
    audioEmitters: loadSceneAudioEmitters(ctx, resource, scene),
    backgroundTexture: hasBackgroundExtension(scene) ? loadGLTFBackgroundTexture(resource, scene) : undefined,
    reflectionProbe: hasReflectionProbeExtension(scene) ? loadGLTFReflectionProbe(ctx, resource, scene) : undefined,
  });

  updateMatrixWorld(sceneEid, true);

  for (const inflator of nodeInflators) {
    inflator();
  }

  if (resource.root.animations) {
    const mixer = new AnimationMixer(group);
    const clips = await Promise.all(
      resource.root.animations.map((a, i) => loadGLTFAnimationClip(ctx, resource, a, i, indexToObject3D))
    );
    const actions = clips.map((clip) => mixer.clipAction(clip));
    addAnimationComponent(ctx.world, sceneEid, { mixer, clips, actions });
  }

  const bloomStrength = getPostprocessingBloomStrength(scene);

  addRemoteSceneComponent(ctx, sceneEid, {
    audioEmitters,
    reflectionProbe,
    backgroundTexture,
    bloomStrength,
  });

  if (hasHubsComponentsExtension(resource.root)) {
    inflateHubsScene(ctx, resource, sceneIndex, sceneEid);
  }

  if (hasCharacterControllerExtension(scene)) {
    inflateSceneCharacterController(ctx, resource, sceneIndex, sceneEid);
  }

  return resource;
}

async function _inflateGLTFNode(
  ctx: GameState,
  resource: GLTFResource,
  eidToObject3D: Map<number, Object3D>,
  indexToObject3D: Map<number, Object3D>,
  nodeInflators: Function[],
  nodeIndex: number,
  parentEid: number,
  createTrimesh = true,
  isStatic = false
) {
  if (!resource.root.nodes || !resource.root.nodes[nodeIndex]) {
    throw new Error(`Node ${nodeIndex} not found`);
  }

  const node = resource.root.nodes[nodeIndex];

  // use pre-generated eid if it exists (for bones)
  const joint = resource.joints.get(nodeIndex);
  const nodeEid = joint ? joint.eid : addEntity(ctx.world);

  // create Object3D
  let obj3d: Object3D;
  if (node.mesh !== undefined && node.skin !== undefined) {
    obj3d = new SkinnedMesh();
  } else if (joint) {
    obj3d = new Bone();
    addComponent(ctx.world, BoneComponent, nodeEid);
    BoneComponent.set(nodeEid, obj3d as Bone);
  } else {
    obj3d = new Object3D();
  }

  if (obj3d) {
    eidToObject3D.set(nodeEid, obj3d);
    indexToObject3D.set(nodeIndex, obj3d);
    if (node.translation) obj3d.position.fromArray(node.translation);
    if (node.rotation) obj3d.quaternion.fromArray(node.rotation);
    if (node.scale) obj3d.scale.fromArray(node.scale);
  }

  node.name = node.name || `Node ${nodeIndex}`;

  addTransformComponent(ctx.world, nodeEid);
  addNameComponent(ctx.world, nodeEid, node.name);

  if (node.matrix) {
    Transform.localMatrix[nodeEid].set(node.matrix);
    mat4.getTranslation(Transform.position[nodeEid], Transform.localMatrix[nodeEid]);
    mat4.getRotation(Transform.quaternion[nodeEid], Transform.localMatrix[nodeEid]);
    mat4.getScaling(Transform.scale[nodeEid], Transform.localMatrix[nodeEid]);
  } else {
    if (node.translation) Transform.position[nodeEid].set(node.translation);
    if (node.rotation) Transform.quaternion[nodeEid].set(node.rotation);
    if (node.scale) Transform.scale[nodeEid].set(node.scale);
  }

  setEulerFromQuaternion(Transform.rotation[nodeEid], Transform.quaternion[nodeEid]);

  if (parentEid !== undefined) {
    addChild(parentEid, nodeEid);
  }

  const promises = promiseObject({
    mesh: node.mesh !== undefined ? loadGLTFMesh(ctx, resource, node.mesh) : undefined,
    instancedMesh:
      node.extensions?.EXT_mesh_gpu_instancing?.attributes !== undefined
        ? _loadGLTFInstancedMesh(ctx, resource, node, node.extensions?.EXT_mesh_gpu_instancing)
        : undefined,
    skinnedMesh:
      node.mesh !== undefined && node.skin !== undefined ? loadGLTFSkinnedMesh(ctx, resource, node) : undefined,
    lightMap:
      node.extensions?.MX_lightmap !== undefined
        ? _loadGLTFLightMap(ctx, resource, node, node.extensions.MX_lightmap)
        : undefined,
    camera: node.camera !== undefined ? loadGLTFCamera(ctx, resource, node.camera) : undefined,
    light:
      node.extensions?.KHR_lights_punctual?.light !== undefined
        ? loadGLTFLight(resource, node.extensions.KHR_lights_punctual.light)
        : undefined,
    audioEmitter: loadNodeAudioEmitter(ctx, resource, node),
    colliderMesh: hasMeshCollider(resource.root, node)
      ? loadGLTFMesh(ctx, resource, getColliderMesh(resource.root, node))
      : undefined,
    reflectionProbe: hasReflectionProbeExtension(node) ? loadGLTFReflectionProbe(ctx, resource, node) : undefined,
  });

  if (node.children && node.children.length) {
    await Promise.all(
      node.children.map((childIndex: number) =>
        _inflateGLTFNode(
          ctx,
          resource,
          eidToObject3D,
          indexToObject3D,
          nodeInflators,
          childIndex,
          nodeEid,
          createTrimesh,
          isStatic
        )
      )
    );
  }

  const results = await promises;

  nodeInflators.push(() => {
    if (parentEid !== undefined) {
      const childObj3d = obj3d;
      const parentObj3d = eidToObject3D.get(parentEid);
      if (!childObj3d) throw new Error("Object3D not found for nodeEid " + nodeEid);
      if (!parentObj3d) throw new Error("Object3D not found for nodeEid " + nodeEid);
      if (parentObj3d && childObj3d) {
        parentObj3d.add(childObj3d);
      }
    }

    if (
      !joint &&
      (results.mesh ||
        results.colliderMesh ||
        results.camera ||
        results.light ||
        results.audioEmitter ||
        results.reflectionProbe ||
        hasTilesRendererExtension(node) ||
        nodeHasCollider(node))
    ) {
      addRemoteNodeComponent(ctx, nodeEid, {
        ...(results as any),
        name: node.name,
        static: isStatic,
        scriptNode: resource.manager.createResource(ScriptNodeResource, {
          name: node.name,
          mesh: results.mesh?.scriptMesh,
          light: results.light,
        }),
      });
    }

    if (hasHubsComponentsExtension(resource.root)) {
      inflateHubsNode(ctx, resource, nodeIndex, nodeEid);
    } else {
      if (node.camera !== undefined) {
        ctx.activeCamera = nodeEid;
      }

      if (node.extras && node.extras["directional-light"]) {
        const remoteNode =
          RemoteNodeComponent.get(nodeEid) ||
          addRemoteNodeComponent(ctx, nodeEid, { name: node.name, static: isStatic });

        if (!remoteNode.light) {
          remoteNode.light = resource.manager.createResource(LightResource, {
            type: LightType.Directional,
            castShadow: true,
            intensity: 0.8,
          });
        }
      }

      if (results.mesh && createTrimesh) {
        addTrimesh(ctx, nodeEid);
      }

      if ((node.extras && node.extras["spawn-point"]) || hasSpawnPointExtension(node) || node.name === "__SpawnPoint") {
        addComponent(ctx.world, SpawnPoint, nodeEid);
      }
    }

    if (hasTilesRendererExtension(node)) {
      addTilesRenderer(ctx, resource, nodeIndex, nodeEid);
    }

    if (nodeHasCollider(node)) {
      addCollider(ctx, resource, node, nodeEid, results.colliderMesh);
    }

    inflatePortalComponent(ctx, node, nodeEid);
  });
}

const GLB_HEADER_BYTE_LENGTH = 12;
const GLB_MAGIC = 0x46546c67; // "glTF" in ASCII

const gltfCache: Map<string, { refCount: number; promise: Promise<GLTFResource> }> = new Map();

export function disposeGLTFResource(resource: GLTFResource): boolean {
  const cachedGltf = gltfCache.get(resource.url);

  let revoke = !cachedGltf;

  if (cachedGltf) {
    cachedGltf.refCount--;

    if (cachedGltf.refCount <= 0) {
      gltfCache.delete(resource.url);

      revoke = true;
    }
  }

  if (revoke) {
    URL.revokeObjectURL(resource.url);

    for (const objectUrl of resource.fileMap.values()) {
      URL.revokeObjectURL(objectUrl);
    }
  }

  return revoke;
}

export async function loadGLTFResource(
  ctx: GameState,
  resourceManager: IRemoteResourceManager,
  uri: string,
  fileMap?: Map<string, string>
): Promise<GLTFResource> {
  const url = new URL(uri, self.location.href);

  // TODO: Add gltfResource pinning
  // const cachedGltf = gltfCache.get(url.href);

  // if (cachedGltf) {
  //   cachedGltf.refCount++;
  //   return cachedGltf.promise;
  // }

  const promise = _loadGLTFResource(ctx, resourceManager, url.href, fileMap);

  // gltfCache.set(url.href, {
  //   refCount: 1,
  //   promise,
  // });

  return promise;
}

async function _loadGLTFResource(
  ctx: GameState,
  resourceManager: IRemoteResourceManager,
  url: string,
  fileMap?: Map<string, string>
) {
  const res = await fetchWithProgress(ctx, url);

  console.log(`Fetching glTF resource: ${url} Content-Length: ${res.headers.get("Content-Length")}`);

  const buffer = await res.arrayBuffer();

  console.log(`glTF resource fetched: ${url} buffer byteLength: ${buffer.byteLength}`);

  // https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#binary-header
  const header = new DataView(buffer, 0, GLB_HEADER_BYTE_LENGTH);
  const isGLB = header.getUint32(0, true) === GLB_MAGIC;
  const version = header.getUint32(4, true);

  if (version < 2) {
    throw new Error(`Unsupported glb version: ${version}`);
  }

  if (isGLB) {
    return loadGLB(resourceManager, buffer, url, fileMap);
  } else {
    const jsonStr = new TextDecoder().decode(buffer);
    const json = JSON.parse(jsonStr);
    return loadGLTF(resourceManager, json, url, undefined, fileMap);
  }
}

const ChunkType = {
  JSON: 0x4e4f534a,
  Bin: 0x004e4942,
};

const CHUNK_HEADER_BYTE_LENGTH = 8;

async function loadGLB(
  resourceManager: IRemoteResourceManager,
  buffer: ArrayBuffer,
  url: string,
  fileMap?: Map<string, string>
): Promise<GLTFResource> {
  let jsonChunkData: string | undefined;
  let binChunkData: SharedArrayBuffer | undefined;

  const header = new DataView(buffer, 0, GLB_HEADER_BYTE_LENGTH);
  const glbLength = header.getUint32(8, true) - GLB_HEADER_BYTE_LENGTH;

  let curOffset = GLB_HEADER_BYTE_LENGTH;

  while (curOffset < glbLength) {
    const chunkHeader = new DataView(buffer, curOffset, CHUNK_HEADER_BYTE_LENGTH);
    const chunkLength = chunkHeader.getUint32(0, true);
    const chunkType = chunkHeader.getUint32(4, true);

    curOffset += CHUNK_HEADER_BYTE_LENGTH;

    if (chunkType === ChunkType.JSON) {
      const chunkData = buffer.slice(curOffset, curOffset + chunkLength);
      const jsonStr = new TextDecoder().decode(chunkData);
      jsonChunkData = JSON.parse(jsonStr);
    } else if (chunkType === ChunkType.Bin) {
      binChunkData = toSharedArrayBuffer(buffer, curOffset, chunkLength);
    }

    // Ignore unknown chunk types

    curOffset += chunkLength;
  }

  if (!jsonChunkData) {
    throw new Error("Invalid glb. Glb has no JSON chunk.");
  }

  return loadGLTF(resourceManager, jsonChunkData, url, binChunkData, fileMap);
}

async function loadGLTF(
  resourceManager: IRemoteResourceManager,
  json: unknown,
  url: string,
  binaryChunk?: SharedArrayBuffer,
  fileMap?: Map<string, string>
): Promise<GLTFResource> {
  const root = json as GLTFRoot;

  if (!root.asset) {
    throw new Error("Invalid glTF file: Missing asset section.");
  }

  if (root.asset.minVersion && root.asset.minVersion !== "2.0") {
    throw new Error(
      `This glTF loader does not meet the file's minimum version requirement of ${root.asset.minVersion}. Only version 2.0 is supported.`
    );
  } else if (!root.asset.minVersion && root.asset.version !== "2.0") {
    throw new Error(
      `This glTF loader does not meet the file's version requirement of ${root.asset.version}. Only version 2.0 is supported.`
    );
  }

  const index = url.lastIndexOf("/");
  // Ex.
  // url = https://matrix.org/path/to/some.gltf
  // baseUrl = https://matrix.org/path/to/
  // imageUrl = `${baseUrl}/image.png`
  const baseUrl = index !== -1 ? url.slice(0, index + 1) : "./";

  const resource: GLTFResource = {
    url,
    fileMap: fileMap || new Map(),
    baseUrl,
    root,
    binaryChunk,
    buffers: new Map(),
    bufferViews: new Map(),
    images: new Map(),
    samplers: new Map(),
    textures: new Map(),
    materials: new Map(),
    accessors: new Map(),
    meshes: new Map(),
    skins: new Map(),
    joints: new Map(),
    lights: new Map(),
    reflectionProbes: new Map(),
    cameras: new Map(),
    audio: new Map(),
    audioSources: new Map(),
    audioEmitters: new Map(),
    cameraPromises: new Map(),
    accessorPromises: new Map(),
    bufferViewPromises: new Map(),
    bufferPromises: new Map(),
    meshPromises: new Map(),
    skinPromises: new Map(),
    lightPromises: new Map(),
    reflectionProbePromises: new Map(),
    imagePromises: new Map(),
    texturePromises: new Map(),
    samplerPromises: new Map(),
    materialPromises: new Map(),
    audioPromises: new Map(),
    audioSourcePromises: new Map(),
    audioEmitterPromises: new Map(),
    manager: resourceManager,
  };

  return resource;
}

export async function loadGLTFBuffer(resource: GLTFResource, index: number): Promise<RemoteBuffer> {
  let remoteBufferPromise = resource.bufferPromises.get(index);

  if (remoteBufferPromise) {
    return remoteBufferPromise;
  }

  remoteBufferPromise = _loadGLTFBuffer(resource, index);

  resource.bufferPromises.set(index, remoteBufferPromise);

  return remoteBufferPromise;
}

async function _loadGLTFBuffer(resource: GLTFResource, index: number) {
  if (!resource.root.buffers || !resource.root.buffers[index]) {
    throw new Error(`Buffer ${index} not found`);
  }

  const { name, uri } = resource.root.buffers[index];

  let data: SharedArrayBuffer;

  if (uri) {
    const filePath = resource.fileMap.get(uri) || uri;
    const url = resolveURL(filePath, resource.baseUrl);
    const response = await fetch(url);
    const bufferData = await response.arrayBuffer();
    data = toSharedArrayBuffer(bufferData);
  } else if (index === 0 && resource.binaryChunk) {
    data = resource.binaryChunk;
  } else {
    throw new Error(`Invalid buffer at index ${index}`);
  }

  const remoteBuffer = resource.manager.createResource(BufferResource, {
    name,
    uri,
    data,
  });

  resource.buffers.set(index, remoteBuffer);

  return remoteBuffer;
}

export async function loadGLTFBufferView(resource: GLTFResource, index: number): Promise<RemoteBufferView> {
  let bufferViewPromise = resource.bufferViewPromises.get(index);

  if (bufferViewPromise) {
    return bufferViewPromise;
  }

  bufferViewPromise = _loadGLTFBufferView(resource, index);

  resource.bufferViewPromises.set(index, bufferViewPromise);

  return bufferViewPromise;
}

async function _loadGLTFBufferView(resource: GLTFResource, index: number): Promise<RemoteBufferView> {
  if (!resource.root.bufferViews || !resource.root.bufferViews[index]) {
    throw new Error(`BufferView ${index} not found`);
  }

  const { name, buffer: bufferIndex, byteOffset, byteStride, byteLength, target } = resource.root.bufferViews[index];
  const buffer = await loadGLTFBuffer(resource, bufferIndex);

  const remoteBufferView = resource.manager.createResource(BufferViewResource, {
    name,
    buffer,
    byteOffset,
    byteStride,
    byteLength,
    target,
  });

  resource.bufferViews.set(index, remoteBufferView);

  return remoteBufferView;
}

interface ImageOptions {
  flipY?: boolean;
}

export async function loadGLTFImage(
  resource: GLTFResource,
  index: number,
  options?: ImageOptions
): Promise<RemoteImage> {
  let imagePromise = resource.imagePromises.get(index);

  if (imagePromise) {
    return imagePromise;
  }

  imagePromise = _loadGLTFImage(resource, index, options);

  resource.imagePromises.set(index, imagePromise);

  return imagePromise;
}

async function _loadGLTFImage(resource: GLTFResource, index: number, options?: ImageOptions): Promise<RemoteImage> {
  if (!resource.root.images || !resource.root.images[index]) {
    throw new Error(`Image ${index} not found`);
  }

  const { name, uri, bufferView: bufferViewIndex, mimeType } = resource.root.images[index];

  let remoteImage: RemoteImage;

  if (uri) {
    const filePath = resource.fileMap.get(uri) || uri;
    const resolvedUri = resolveURL(filePath, resource.baseUrl);
    remoteImage = resource.manager.createResource(ImageResource, {
      name,
      uri: resolvedUri,
      flipY: options?.flipY,
    });
  } else if (bufferViewIndex !== undefined) {
    if (!mimeType) {
      throw new Error(`image[${index}] has a bufferView but no mimeType`);
    }

    const bufferView = await loadGLTFBufferView(resource, bufferViewIndex);

    remoteImage = resource.manager.createResource(ImageResource, {
      name,
      bufferView,
      mimeType,
      flipY: options?.flipY,
    });
  } else {
    throw new Error(`image[${index}] has no uri or bufferView`);
  }

  resource.images.set(index, remoteImage);

  return remoteImage;
}

interface SamplerOptions {
  mapping?: SamplerMapping;
}

export async function loadGLTFSampler(
  resource: GLTFResource,
  index: number,
  options?: SamplerOptions
): Promise<RemoteSampler> {
  let samplerPromise = resource.samplerPromises.get(index);

  if (samplerPromise) {
    return samplerPromise;
  }

  samplerPromise = _loadGLTFSampler(resource, index, options);

  resource.samplerPromises.set(index, samplerPromise);

  return samplerPromise;
}

export async function _loadGLTFSampler(
  resource: GLTFResource,
  index: number,
  options?: SamplerOptions
): Promise<RemoteSampler> {
  if (!resource.root.samplers || !resource.root.samplers[index]) {
    throw new Error(`Sampler ${index} not found`);
  }

  const { name, magFilter, minFilter, wrapS, wrapT } = resource.root.samplers[index];

  const remoteSampler = resource.manager.createResource(SamplerResource, {
    name,
    magFilter,
    minFilter,
    wrapS,
    wrapT,
    mapping: options?.mapping,
  });

  resource.samplers.set(index, remoteSampler);

  return remoteSampler;
}

interface TextureOptions {
  encoding?: TextureEncoding;
  mapping?: SamplerMapping;
  flipY?: boolean;
}

export async function loadGLTFTexture(
  resource: GLTFResource,
  index: number,
  options?: TextureOptions
): Promise<RemoteTexture> {
  let texturePromise = resource.texturePromises.get(index);

  if (texturePromise) {
    return texturePromise;
  }

  texturePromise = _loadGLTFTexture(resource, index, options);

  resource.texturePromises.set(index, texturePromise);

  return texturePromise;
}

async function _loadGLTFTexture(
  resource: GLTFResource,
  index: number,
  options?: TextureOptions
): Promise<RemoteTexture> {
  if (!resource.root.textures || !resource.root.textures[index]) {
    throw new Error(`Texture ${index} not found`);
  }

  const texture = resource.root.textures[index];

  const isBasis = hasBasisuExtension(texture);

  if (texture.source === undefined && !isBasis) {
    throw new Error(`texture[${index}].source is undefined.`);
  }

  const { image, sampler } = await promiseObject({
    image: isBasis
      ? loadBasisuImage(resource, texture)
      : loadGLTFImage(resource, texture.source!, { flipY: options?.flipY }),
    sampler: texture.sampler ? loadGLTFSampler(resource, texture.sampler, { mapping: options?.mapping }) : undefined,
  });

  const remoteTexture = resource.manager.createResource(TextureResource, {
    name: texture.name,
    source: image,
    encoding: options?.encoding,
    sampler,
  });

  resource.textures.set(index, remoteTexture);

  return remoteTexture;
}

export async function loadGLTFMaterial(resource: GLTFResource, index: number): Promise<RemoteMaterial> {
  let materialPromise = resource.materialPromises.get(index);

  if (materialPromise) {
    return materialPromise;
  }

  materialPromise = _loadGLTFMaterial(resource, index);

  resource.materialPromises.set(index, materialPromise);

  return materialPromise;
}

const GLTFAlphaModes: { [key: string]: MaterialAlphaMode } = {
  OPAQUE: MaterialAlphaMode.OPAQUE,
  MASK: MaterialAlphaMode.MASK,
  BLEND: MaterialAlphaMode.BLEND,
};

async function _loadGLTFMaterial(resource: GLTFResource, index: number): Promise<RemoteMaterial> {
  if (!resource.root.materials || !resource.root.materials[index]) {
    throw new Error(`Material ${index} not found`);
  }

  const materialDef = resource.root.materials[index];

  const {
    name,
    doubleSided,
    alphaMode,
    alphaCutoff,
    pbrMetallicRoughness,
    extensions,
    normalTexture,
    occlusionTexture,
    emissiveFactor,
    emissiveTexture,
  } = materialDef;

  let remoteMaterial: RemoteMaterial;

  if (extensions?.KHR_materials_unlit) {
    const { baseColorTexture } = await promiseObject({
      baseColorTexture:
        pbrMetallicRoughness?.baseColorTexture?.index !== undefined
          ? loadGLTFTexture(resource, pbrMetallicRoughness.baseColorTexture.index, {
              encoding: TextureEncoding.sRGB,
            })
          : undefined,
    });

    remoteMaterial = resource.manager.createResource(MaterialResource, {
      type: MaterialType.Unlit,
      name,
      doubleSided,
      alphaMode: alphaMode ? GLTFAlphaModes[alphaMode] : undefined,
      alphaCutoff,
      baseColorFactor: pbrMetallicRoughness?.baseColorFactor,
      baseColorTexture,
    });
  } else {
    const transmissionTextureInfo = getTransmissionTextureInfo(materialDef);
    const thicknessTextureInfo = getThicknessTextureInfo(materialDef);

    const {
      baseColorTexture,
      metallicRoughnessTexture,
      normalTexture: _normalTexture,
      occlusionTexture: _occlusionTexture,
      emissiveTexture: _emissiveTexture,
      transmissionTexture,
      thicknessTexture,
    } = await promiseObject({
      baseColorTexture:
        pbrMetallicRoughness?.baseColorTexture?.index !== undefined
          ? loadGLTFTexture(resource, pbrMetallicRoughness?.baseColorTexture?.index, {
              encoding: TextureEncoding.sRGB,
            })
          : undefined,
      metallicRoughnessTexture:
        pbrMetallicRoughness?.metallicRoughnessTexture?.index !== undefined
          ? loadGLTFTexture(resource, pbrMetallicRoughness?.metallicRoughnessTexture?.index)
          : undefined,
      normalTexture: normalTexture?.index !== undefined ? loadGLTFTexture(resource, normalTexture?.index) : undefined,
      occlusionTexture:
        occlusionTexture?.index !== undefined ? loadGLTFTexture(resource, occlusionTexture?.index) : undefined,
      emissiveTexture:
        emissiveTexture?.index !== undefined
          ? loadGLTFTexture(resource, emissiveTexture?.index, { encoding: TextureEncoding.sRGB })
          : undefined,
      transmissionTexture: transmissionTextureInfo
        ? loadGLTFTexture(resource, transmissionTextureInfo.index)
        : undefined,
      thicknessTexture: thicknessTextureInfo ? loadGLTFTexture(resource, thicknessTextureInfo.index) : undefined,
    });
    remoteMaterial = resource.manager.createResource(MaterialResource, {
      type: MaterialType.Standard,
      name,
      doubleSided,
      alphaMode: alphaMode ? GLTFAlphaModes[alphaMode] : undefined,
      alphaCutoff,
      baseColorFactor: pbrMetallicRoughness?.baseColorFactor,
      baseColorTexture,
      metallicFactor: pbrMetallicRoughness?.metallicFactor,
      roughnessFactor: pbrMetallicRoughness?.roughnessFactor,
      metallicRoughnessTexture,
      normalTextureScale: normalTexture?.scale,
      normalTexture: _normalTexture,
      occlusionTextureStrength: occlusionTexture?.strength,
      occlusionTexture: _occlusionTexture,
      emissiveFactor,
      emissiveStrength: getEmissiveStrength(materialDef),
      emissiveTexture: _emissiveTexture,
      transmissionTexture,
      thicknessTexture,
      ior: getMaterialIOR(materialDef),
      transmissionFactor: getTransmissionFactor(materialDef),
      ...getVolumeMaterialProperties(materialDef),
    });
  }

  resource.materials.set(index, remoteMaterial);

  return remoteMaterial;
}

const GLTFAccessorTypeToAccessorType: { [key: string]: AccessorType } = {
  SCALAR: AccessorType.SCALAR,
  VEC2: AccessorType.VEC2,
  VEC3: AccessorType.VEC3,
  VEC4: AccessorType.VEC4,
  MAT2: AccessorType.MAT2,
  MAT3: AccessorType.MAT3,
  MAT4: AccessorType.MAT4,
};

export async function loadGLTFAccessor(
  ctx: GameState,
  resource: GLTFResource,
  index: number
): Promise<RemoteAccessor<any>> {
  let accessorPromise = resource.accessorPromises.get(index);

  if (accessorPromise) {
    return accessorPromise;
  }

  accessorPromise = _loadGLTFAccessor(ctx, resource, index);

  resource.accessorPromises.set(index, accessorPromise);

  return accessorPromise;
}

async function _loadGLTFAccessor(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteAccessor<any>> {
  if (!resource.root.accessors || !resource.root.accessors[index]) {
    throw new Error(`Accessor ${index} not found`);
  }

  const accessor = resource.root.accessors[index];

  const { bufferView, sparseValuesBufferView, sparseIndicesBufferView } = await promiseObject({
    bufferView: accessor.bufferView !== undefined ? loadGLTFBufferView(resource, accessor.bufferView) : undefined,
    sparseValuesBufferView:
      accessor.sparse?.values !== undefined
        ? loadGLTFBufferView(resource, accessor.sparse.values.bufferView)
        : undefined,
    sparseIndicesBufferView:
      accessor.sparse?.indices !== undefined
        ? loadGLTFBufferView(resource, accessor.sparse.indices.bufferView)
        : undefined,
  });

  if (accessor.sparse && (!sparseIndicesBufferView || !sparseValuesBufferView)) {
    throw new Error("Sparse accessor missing bufferViews");
  }

  const remoteAccessor = createRemoteAccessor(ctx, {
    name: accessor.name,
    bufferView,
    type: GLTFAccessorTypeToAccessorType[accessor.type],
    componentType: accessor.componentType,
    count: accessor.count,
    byteOffset: accessor.byteOffset,
    normalized: accessor.normalized,
    min: accessor.min,
    max: accessor.max,
    sparse: accessor.sparse
      ? {
          count: accessor.sparse.count,
          indices: {
            byteOffset: accessor.sparse.indices.byteOffset,
            componentType: accessor.sparse.indices.componentType,
            bufferView: sparseIndicesBufferView!,
          },
          values: {
            byteOffset: accessor.sparse.values.byteOffset,
            bufferView: sparseValuesBufferView!,
          },
        }
      : undefined,
  });

  resource.accessors.set(index, remoteAccessor);

  return remoteAccessor;
}

export async function loadGLTFMesh(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteMesh> {
  let meshPromise = resource.meshPromises.get(index);

  if (meshPromise) {
    return meshPromise;
  }

  meshPromise = _loadGLTFMesh(ctx, resource, index);

  resource.meshPromises.set(index, meshPromise);

  return meshPromise;
}

async function _loadGLTFMesh(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteMesh> {
  if (!resource.root.meshes || !resource.root.meshes[index]) {
    throw new Error(`Mesh ${index} not found`);
  }

  const mesh = resource.root.meshes[index];

  const primitives: MeshPrimitiveProps[] = await Promise.all(
    mesh.primitives.map((primitive) => _createGLTFMeshPrimitive(ctx, resource, primitive))
  );

  const scriptPrimitives: ScriptRemoteMeshPrimitive[] = [];

  for (const primitive of primitives) {
    if (primitive.scriptMeshPrimitive) {
      scriptPrimitives.push(primitive.scriptMeshPrimitive);
    }
  }

  const remoteMesh = createRemoteMesh(ctx, {
    name: mesh.name,
    primitives,
    scriptMesh: resource.manager.createResource(ScriptMeshResource, {
      name: mesh.name,
      primitives: scriptPrimitives,
    }),
  });

  resource.meshes.set(index, remoteMesh);

  return remoteMesh;
}

async function _createGLTFMeshPrimitive(
  ctx: GameState,
  resource: GLTFResource,
  primitive: GLTFMeshPrimitive
): Promise<MeshPrimitiveProps> {
  const attributesPromises: { [key: string]: Promise<RemoteAccessor<any>> } = {};

  for (const key in primitive.attributes) {
    attributesPromises[key] = loadGLTFAccessor(ctx, resource, primitive.attributes[key]);
  }

  const { indices, attributes, material } = await promiseObject({
    indices: primitive.indices !== undefined ? loadGLTFAccessor(ctx, resource, primitive.indices) : undefined,
    attributes: promiseObject(attributesPromises),
    material: primitive.material !== undefined ? loadGLTFMaterial(resource, primitive.material) : undefined,
  });

  return {
    indices,
    attributes,
    material,
    mode: primitive.mode,
    scriptMeshPrimitive: resource.manager.createResource(ScriptMeshPrimitiveResource, {
      material,
    }),
  };
}

async function _loadGLTFInstancedMesh(
  ctx: GameState,
  resource: GLTFResource,
  node: GLTFNode,
  extension: GLTFInstancedMeshExtension
): Promise<RemoteInstancedMesh> {
  const attributesPromises: { [key: string]: Promise<RemoteAccessor<any>> } = {};

  for (const key in extension.attributes) {
    attributesPromises[key] = loadGLTFAccessor(ctx, resource, extension.attributes[key]);
  }

  const attributes = await promiseObject(attributesPromises);

  return createRemoteInstancedMesh(ctx, { name: `${node.name} Instanced Mesh`, attributes });
}

async function loadGLTFSkinnedMesh(ctx: GameState, resource: GLTFResource, node: GLTFNode): Promise<RemoteSkinnedMesh> {
  const index = node.skin;

  if (index === undefined || !resource.root.skins || !resource.root.skins[index]) {
    throw new Error("glTF file has no skins");
  }

  let skinPromise = resource.skinPromises.get(index);

  if (skinPromise) {
    return skinPromise;
  }

  skinPromise = _loadGLTFSkinnedMesh(ctx, resource, node);

  resource.skinPromises.set(index, skinPromise);

  return skinPromise;
}

async function _loadGLTFSkinnedMesh(
  ctx: GameState,
  resource: GLTFResource,
  node: GLTFNode
): Promise<RemoteSkinnedMesh> {
  const index = node.skin;

  if (index === undefined || !resource.root.skins || !resource.root.skins[index]) {
    throw new Error("glTF file has no skins");
  }

  const skin = resource.root.skins[index];

  const inverseBindMatrices = skin.inverseBindMatrices
    ? await loadGLTFAccessor(ctx, resource, skin.inverseBindMatrices)
    : undefined;

  const joints: RemoteNode[] = [];

  for (let i = 0; i < skin.joints.length; i++) {
    const jointIndex = skin.joints[i];
    const jointResource = resource.joints.get(jointIndex);
    if (jointResource) joints.push(jointResource);
    else throw new Error("glTF skin joint had no remote node resourceId");
  }

  const remoteSkinnedMesh = createRemoteSkinnedMesh(ctx, {
    name: `${node.name} Skinned Mesh`,
    joints,
    inverseBindMatrices,
  });

  resource.skins.set(index, remoteSkinnedMesh);

  return remoteSkinnedMesh;
}

async function _loadGLTFLightMap(
  ctx: GameState,
  resource: GLTFResource,
  node: GLTFNode,
  extension: GLTFLightmapExtension
): Promise<RemoteLightMap> {
  const texture = await loadGLTFTexture(resource, extension.lightMapTexture.index, {
    encoding: TextureEncoding.sRGB,
  });

  return createRemoteLightMap(ctx, {
    name: `${node.name} Light Map`,
    texture,
    scale: extension.scale as vec2 | undefined,
    offset: extension.offset as vec2 | undefined,
    intensity: extension.intensity,
  });
}

export async function loadGLTFCamera(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteCamera> {
  let cameraPromise = resource.cameraPromises.get(index);

  if (cameraPromise) {
    return cameraPromise;
  }

  cameraPromise = _loadGLTFCamera(ctx, resource, index);

  resource.cameraPromises.set(index, cameraPromise);

  return cameraPromise;
}

async function _loadGLTFCamera(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteCamera> {
  if (!resource.root.cameras || !resource.root.cameras[index]) {
    throw new Error("glTF file has no cameras");
  }

  const camera = resource.root.cameras[index];

  let remoteCamera: RemoteCamera;

  if (camera.perspective) {
    remoteCamera = resource.manager.createResource(CameraResource, {
      name: camera.name,
      type: CameraType.Perspective,
      aspectRatio: camera.perspective.aspectRatio,
      yfov: camera.perspective.yfov,
      zfar: camera.perspective.zfar,
      znear: camera.perspective.znear,
    });
  } else if (camera.orthographic) {
    remoteCamera = resource.manager.createResource(CameraResource, {
      name: camera.name,
      type: CameraType.Orthographic,
      xmag: camera.orthographic.xmag,
      ymag: camera.orthographic.ymag,
      zfar: camera.orthographic.zfar,
      znear: camera.orthographic.znear,
    });
  } else {
    throw new Error("Camera was of unknown type");
  }

  resource.cameras.set(index, remoteCamera);

  return remoteCamera;
}

const GLTFLightTypeToLightType: { [key: string]: LightType } = {
  directional: LightType.Directional,
  point: LightType.Point,
  spot: LightType.Spot,
};

export async function loadGLTFLight(resource: GLTFResource, index: number): Promise<RemoteLight> {
  let lightPromise = resource.lightPromises.get(index);

  if (lightPromise) {
    return lightPromise;
  }

  lightPromise = _loadGLTFLight(resource, index);

  resource.lightPromises.set(index, lightPromise);

  return lightPromise;
}

async function _loadGLTFLight(resource: GLTFResource, index: number): Promise<RemoteLight> {
  if (!resource.root.extensions?.KHR_lights_punctual) {
    throw new Error("glTF file has no KHR_lights_punctual extension");
  }

  const lightExtension = resource.root.extensions?.KHR_lights_punctual;

  if (!lightExtension.lights || !lightExtension.lights[index]) {
    throw new Error(`Light ${index} not found`);
  }

  const { name, type, color, intensity, range, spot } = lightExtension.lights[index];

  const lightResource = resource.manager.createResource(LightResource, {
    name,
    type: GLTFLightTypeToLightType[type],
    color,
    intensity,
    range,
    innerConeAngle: spot?.innerConeAngle,
    outerConeAngle: spot?.outerConeAngle,
  });

  resource.lights.set(index, lightResource);

  return lightResource;
}
