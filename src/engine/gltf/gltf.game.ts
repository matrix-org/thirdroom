import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, addEntity } from "bitecs";
import { mat4, quat, vec3 } from "gl-matrix";
import { Matrix4 } from "three";

import { createRemoteAccessor, RemoteAccessor } from "../accessor/accessor.game";
import { AudioEmitterOutput } from "../audio/audio.common";
import {
  createRemoteAudioData,
  createRemoteAudioFromBufferView,
  createRemoteAudioSource,
  createRemoteGlobalAudioEmitter,
  createRemotePositionalAudioEmitter,
  RemoteAudioData,
  RemoteAudioEmitter,
  RemoteAudioSource,
  RemoteGlobalAudioEmitter,
} from "../audio/audio.game";
import { createRemoteBufferView, RemoteBufferView } from "../bufferView/bufferView.game";
import { createRemoteOrthographicCamera, createRemotePerspectiveCamera, RemoteCamera } from "../camera/camera.game";
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
import { createRemoteImage, createRemoteImageFromBufferView, RemoteImage } from "../image/image.game";
import {
  createDirectionalLightResource,
  createPointLightResource,
  createSpotLightResource,
  RemoteLight,
} from "../light/light.game";
import { MaterialAlphaMode } from "../material/material.common";
import { createRemoteStandardMaterial, createRemoteUnlitMaterial, RemoteMaterial } from "../material/material.game";
import {
  createRemoteInstancedMesh,
  createRemoteMesh,
  MeshPrimitiveProps,
  RemoteInstancedMesh,
  RemoteMesh,
} from "../mesh/mesh.game";
import { getModule, Thread } from "../module/module.common";
import { addRemoteNodeComponent, RemoteNodeComponent } from "../node/node.game";
import { addRigidBody, PhysicsModule } from "../physics/physics.game";
import { addResourceRef, disposeResource } from "../resource/resource.game";
import { createRemoteSampler, RemoteSampler } from "../sampler/sampler.game";
import { addRemoteSceneComponent } from "../scene/scene.game";
import { TextureEncoding } from "../texture/texture.common";
import { createRemoteTexture, RemoteTexture } from "../texture/texture.game";
import { promiseObject } from "../utils/promiseObject";
import resolveURL from "../utils/resolveURL";
import { GLTFRoot, GLTFMeshPrimitive, GLTFLightType, GLTFInstancedMeshExtension, GLTFNode } from "./GLTF";
import { hasHubsComponentsExtension, inflateHubsNode, inflateHubsScene } from "./MOZ_hubs_components";
import { hasCharacterControllerExtension, inflateSceneCharacterController } from "./MX_character_controller";
import { hasSpawnPointExtension } from "./MX_spawn_point";
import { addTilesRenderer, hasTilesRendererExtension } from "./MX_tiles_renderer";

export interface GLTFResource {
  url: string;
  baseUrl: string;
  root: GLTFRoot;
  binaryChunk?: ArrayBuffer;
  cameras: Map<number, RemoteCamera>;
  accessors: Map<number, RemoteAccessor<any, any>>;
  bufferViews: Map<number, RemoteBufferView<Thread, any>>;
  buffers: Map<number, ArrayBuffer>;
  meshes: Map<number, RemoteMesh>;
  lights: Map<number, RemoteLight>;
  images: Map<number, RemoteImage>;
  textures: Map<number, RemoteTexture>;
  samplers: Map<number, RemoteSampler>;
  materials: Map<number, RemoteMaterial>;
  audio: Map<number, RemoteAudioData>;
  audioSources: Map<number, RemoteAudioSource>;
  audioEmitters: Map<number, RemoteAudioEmitter>;
  cameraPromises: Map<number, Promise<RemoteCamera>>;
  accessorPromises: Map<number, Promise<RemoteAccessor<any, any>>>;
  bufferViewPromises: Map<number, { thread: Thread; shared: boolean; promise: Promise<RemoteBufferView<Thread, any>> }>;
  bufferPromises: Map<number, Promise<ArrayBuffer>>;
  meshPromises: Map<number, Promise<RemoteMesh>>;
  lightPromises: Map<number, Promise<RemoteLight>>;
  imagePromises: Map<number, Promise<RemoteImage>>;
  texturePromises: Map<number, Promise<RemoteTexture>>;
  samplerPromises: Map<number, Promise<RemoteSampler>>;
  materialPromises: Map<number, Promise<RemoteMaterial>>;
  audioPromises: Map<number, Promise<RemoteAudioData>>;
  audioSourcePromises: Map<number, Promise<RemoteAudioSource>>;
  audioEmitterPromises: Map<number, { output: AudioEmitterOutput; promise: Promise<RemoteAudioEmitter> }>;
}

export function createGLTFEntity(ctx: GameState, uri: string) {
  const eid = addEntity(ctx.world);
  inflateGLTFScene(ctx, eid, uri);
  return eid;
}

export async function inflateGLTFScene(
  ctx: GameState,
  sceneEid: number,
  uri: string,
  sceneIndex?: number,
  // TODO: temporary hack for spawning avatars without static trimesh
  createTrimesh = true
): Promise<GLTFResource> {
  addTransformComponent(ctx.world, sceneEid);

  const resource = await loadGLTFResource(uri);

  if (sceneIndex === undefined) {
    sceneIndex = resource.root.scene;
  }

  if (sceneIndex === undefined || !resource.root.scenes || !resource.root.scenes[sceneIndex]) {
    throw new Error(`Scene ${sceneIndex} not found`);
  }

  const hasInstancedMeshExtension =
    resource.root.extensionsUsed && resource.root.extensionsUsed.includes("EXT_mesh_gpu_instancing");

  const scene = resource.root.scenes[sceneIndex];

  addNameComponent(ctx.world, sceneEid, scene.name || `Scene ${sceneIndex}`);

  const nodeInflators: Function[] = [];

  let nodePromise: Promise<void[]> | undefined;

  if (scene.nodes) {
    nodePromise = Promise.all(
      scene.nodes.map((nodeIndex) =>
        _inflateGLTFNode(ctx, resource, nodeInflators, nodeIndex, sceneEid, createTrimesh && !hasInstancedMeshExtension)
      )
    );
  }

  const { audioEmitters } = await promiseObject({
    nodePromise,
    audioEmitters: scene.extensions?.KHR_audio?.emitters
      ? (Promise.all(
          scene.extensions.KHR_audio.emitters.map((emitterIndex: number) =>
            loadGLTFAudioEmitter(ctx, resource, emitterIndex)
          )
        ) as Promise<RemoteGlobalAudioEmitter[]>)
      : undefined,
  });

  updateMatrixWorld(sceneEid);

  for (const inflator of nodeInflators) {
    inflator();
  }

  addRemoteSceneComponent(ctx, sceneEid, {
    audioEmitters,
  });

  if (hasHubsComponentsExtension(resource.root)) {
    inflateHubsScene(ctx, resource, sceneIndex, sceneEid);
  }

  if (hasCharacterControllerExtension(scene)) {
    inflateSceneCharacterController(ctx, resource, sceneIndex, sceneEid);
  }

  return resource;
}

const tempPosition = vec3.create();
const tempRotation = quat.create();
const tempScale = vec3.create();

const TRIMESH_COLLISION_GROUPS = 0xf000_000f;

async function _inflateGLTFNode(
  ctx: GameState,
  resource: GLTFResource,
  nodeInflators: Function[],
  nodeIndex: number,
  parentEid?: number,
  createTrimesh = true
) {
  const nodeEid = addEntity(ctx.world);

  addTransformComponent(ctx.world, nodeEid);

  if (parentEid !== undefined) {
    addChild(parentEid, nodeEid);
  }

  if (!resource.root.nodes || !resource.root.nodes[nodeIndex]) {
    throw new Error(`Node ${nodeIndex} not found`);
  }

  const node = resource.root.nodes[nodeIndex];

  addNameComponent(ctx.world, nodeEid, node.name || `Node ${nodeIndex}`);

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

  const promises = promiseObject({
    mesh: node.mesh !== undefined ? loadGLTFMesh(ctx, resource, node.mesh) : undefined,
    instancedMesh:
      node.extensions?.EXT_mesh_gpu_instancing?.attributes !== undefined
        ? _loadGLTFInstancedMesh(ctx, resource, node, node.extensions?.EXT_mesh_gpu_instancing)
        : undefined,
    camera: node.camera !== undefined ? loadGLTFCamera(ctx, resource, node.camera) : undefined,
    light:
      node.extensions?.KHR_lights_punctual?.light !== undefined
        ? loadGLTFLight(ctx, resource, node.extensions.KHR_lights_punctual.light)
        : undefined,
    audioEmitter:
      node.extensions?.KHR_audio?.emitter !== undefined
        ? loadGLTFAudioEmitter(ctx, resource, node.extensions.KHR_audio.emitter)
        : undefined,
    colliderMesh:
      node.extensions?.OMI_collider !== undefined &&
      resource.root.extensions?.OMI_collider &&
      resource.root.extensions.OMI_collider.colliders[node.extensions.OMI_collider.collider].mesh !== undefined
        ? loadGLTFMesh(
            ctx,
            resource,
            resource.root.extensions.OMI_collider.colliders[node.extensions.OMI_collider.collider].mesh
          )
        : undefined,
  });

  if (node.children && node.children.length) {
    await Promise.all(
      node.children.map((childIndex: number) =>
        _inflateGLTFNode(ctx, resource, nodeInflators, childIndex, nodeEid, createTrimesh)
      )
    );
  }

  const results = await promises;

  nodeInflators.push(() => {
    if (results.mesh || results.camera || results.light || results.audioEmitter || hasTilesRendererExtension(node)) {
      addRemoteNodeComponent(ctx, nodeEid, { ...(results as any), name: node.name });
    }

    if (hasHubsComponentsExtension(resource.root)) {
      inflateHubsNode(ctx, resource, nodeIndex, nodeEid);
    } else {
      if (node.camera) {
        ctx.activeCamera = nodeEid;
      }

      if (node.extras && node.extras["directional-light"]) {
        const remoteNode = RemoteNodeComponent.get(nodeEid);

        if (remoteNode && !remoteNode.light) {
          remoteNode.light = createDirectionalLightResource(ctx, {
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

    if (node.extensions?.OMI_collider) {
      const index = node.extensions.OMI_collider.collider;
      const collider = resource.root.extensions!.OMI_collider.colliders[index];
      const { physicsWorld } = getModule(ctx, PhysicsModule);

      if (collider.type === "box") {
        const worldMatrix = Transform.worldMatrix[nodeEid];
        mat4.getTranslation(tempPosition, worldMatrix);
        mat4.getRotation(tempRotation, worldMatrix);
        mat4.getScaling(tempScale, worldMatrix);

        const rigidBodyDesc = RAPIER.RigidBodyDesc.newStatic();
        rigidBodyDesc.setTranslation(tempPosition[0], tempPosition[1], tempPosition[2]);
        rigidBodyDesc.setRotation(
          new RAPIER.Quaternion(tempRotation[0], tempRotation[1], tempRotation[2], tempRotation[3])
        );
        const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

        vec3.mul(tempScale, tempScale, collider.extents);
        const colliderDesc = RAPIER.ColliderDesc.cuboid(tempScale[0], tempScale[1], tempScale[2]);
        colliderDesc.setTranslation(collider.center[0], collider.center[1], collider.center[2]);
        colliderDesc.setCollisionGroups(TRIMESH_COLLISION_GROUPS);
        colliderDesc.setSolverGroups(TRIMESH_COLLISION_GROUPS);
        physicsWorld.createCollider(colliderDesc, rigidBody.handle);

        addRigidBody(ctx.world, nodeEid, rigidBody);
      } else if (collider.type === "mesh" && results.colliderMesh) {
        addTrimeshFromMesh(ctx, nodeEid, results.colliderMesh);
      }
    }
  });
}

export function addTrimesh(ctx: GameState, nodeEid: number) {
  const remoteNode = RemoteNodeComponent.get(nodeEid);

  if (!remoteNode || !remoteNode.mesh) {
    return;
  }

  addTrimeshFromMesh(ctx, nodeEid, remoteNode.mesh);
}

function addTrimeshFromMesh(ctx: GameState, nodeEid: number, mesh: RemoteMesh) {
  const { physicsWorld } = getModule(ctx, PhysicsModule);

  // TODO: We don't really need the whole RemoteMesh just for a trimesh and tracking
  // the resource is expensive.
  addResourceRef(ctx, mesh.resourceId);

  for (const primitive of mesh.primitives) {
    addResourceRef(ctx, primitive.resourceId);

    const rigidBodyDesc = RAPIER.RigidBodyDesc.newStatic();
    const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

    const positionsAttribute = primitive.attributes.POSITION.attribute.clone();
    const worldMatrix = new Matrix4().fromArray(Transform.worldMatrix[nodeEid]);
    positionsAttribute.applyMatrix4(worldMatrix);

    const indicesAttribute = primitive.indices?.attribute;

    let indicesArr: Uint32Array;

    if (!indicesAttribute) {
      indicesArr = new Uint32Array(positionsAttribute.count);

      for (let i = 0; i < indicesArr.length; i++) {
        indicesArr[i] = i;
      }
    } else {
      indicesArr = new Uint32Array(indicesAttribute.count);
      indicesArr.set(indicesAttribute.array);
    }

    const colliderDesc = RAPIER.ColliderDesc.trimesh(positionsAttribute.array as Float32Array, indicesArr);

    colliderDesc.setCollisionGroups(TRIMESH_COLLISION_GROUPS);
    colliderDesc.setSolverGroups(TRIMESH_COLLISION_GROUPS);

    physicsWorld.createCollider(colliderDesc, rigidBody.handle);

    const primitiveEid = addEntity(ctx.world);
    addTransformComponent(ctx.world, primitiveEid);
    addChild(nodeEid, primitiveEid);
    addRigidBody(ctx.world, nodeEid, rigidBody);

    disposeResource(ctx, primitive.resourceId);
  }

  disposeResource(ctx, mesh.resourceId);
}

const GLB_HEADER_BYTE_LENGTH = 12;
const GLB_MAGIC = 0x46546c67; // "glTF" in ASCII

const gltfCache: Map<string, { refCount: number; promise: Promise<GLTFResource> }> = new Map();

export function disposeGLTFResource(resource: GLTFResource): boolean {
  const cachedGltf = gltfCache.get(resource.url);

  if (!cachedGltf) {
    return false;
  }

  cachedGltf.refCount--;

  if (cachedGltf.refCount <= 0) {
    gltfCache.delete(resource.url);
  }

  return true;
}

export async function loadGLTFResource(uri: string): Promise<GLTFResource> {
  const url = new URL(uri, self.location.href);

  // TODO: Add gltfResource pinning
  // const cachedGltf = gltfCache.get(url.href);

  // if (cachedGltf) {
  //   cachedGltf.refCount++;
  //   return cachedGltf.promise;
  // }

  const promise = _loadGLTFResource(url.href);

  // gltfCache.set(url.href, {
  //   refCount: 1,
  //   promise,
  // });

  return promise;
}

async function _loadGLTFResource(url: string) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  // https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#binary-header
  const header = new DataView(buffer, 0, GLB_HEADER_BYTE_LENGTH);
  const isGLB = header.getUint32(0, true) === GLB_MAGIC;
  const version = header.getUint32(4, true);

  if (version < 2) {
    throw new Error(`Unsupported glb version: ${version}`);
  }

  if (isGLB) {
    return loadGLB(buffer, url);
  } else {
    const jsonStr = new TextDecoder().decode(buffer);
    const json = JSON.parse(jsonStr);
    return loadGLTF(json, url);
  }
}

const ChunkType = {
  JSON: 0x4e4f534a,
  Bin: 0x004e4942,
};

const CHUNK_HEADER_BYTE_LENGTH = 8;

async function loadGLB(buffer: ArrayBuffer, url: string): Promise<GLTFResource> {
  let jsonChunkData: string | undefined;
  let binChunkData: ArrayBuffer | undefined;

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
      const chunkData = buffer.slice(curOffset, curOffset + chunkLength);
      binChunkData = chunkData;
    }

    // Ignore unknown chunk types

    curOffset += chunkLength;
  }

  if (!jsonChunkData) {
    throw new Error("Invalid glb. Glb has no JSON chunk.");
  }

  return loadGLTF(jsonChunkData, url, binChunkData);
}

async function loadGLTF(json: unknown, url: string, binaryChunk?: ArrayBuffer): Promise<GLTFResource> {
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
    lights: new Map(),
    cameras: new Map(),
    audio: new Map(),
    audioSources: new Map(),
    audioEmitters: new Map(),
    cameraPromises: new Map(),
    accessorPromises: new Map(),
    bufferViewPromises: new Map(),
    bufferPromises: new Map(),
    meshPromises: new Map(),
    lightPromises: new Map(),
    imagePromises: new Map(),
    texturePromises: new Map(),
    samplerPromises: new Map(),
    materialPromises: new Map(),
    audioPromises: new Map(),
    audioSourcePromises: new Map(),
    audioEmitterPromises: new Map(),
  };

  return resource;
}

export async function loadGLTFBuffer(resource: GLTFResource, index: number): Promise<ArrayBuffer> {
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

  const buffer = resource.root.buffers[index];

  let bufferData: ArrayBuffer;

  if (buffer.uri) {
    const url = resolveURL(buffer.uri, resource.baseUrl);
    const response = await fetch(url);
    bufferData = await response.arrayBuffer();
  } else if (index === 0 && resource.binaryChunk) {
    bufferData = resource.binaryChunk;
  } else {
    throw new Error(`Invalid buffer at index ${index}`);
  }

  resource.buffers.set(index, bufferData);

  return bufferData;
}

export async function loadGLTFBufferView<T extends Thread, S extends boolean>(
  ctx: GameState,
  resource: GLTFResource,
  index: number,
  thread: T,
  shared: S
): Promise<RemoteBufferView<T, S extends true ? SharedArrayBuffer : undefined>> {
  const result = resource.bufferViewPromises.get(index);

  if (result) {
    if (result.thread !== thread) {
      throw new Error(
        `BufferView ${index} is already being used on ${result.thread} thread. You cannot also use it on the ${thread} thread.`
      );
    }

    if (result.shared !== shared) {
      throw new Error(`BufferView ${index} cannot be backed by both an ArrayBuffer and SharedArrayBuffer.`);
    }

    return result.promise as Promise<RemoteBufferView<T, any>>;
  }

  const promise = _loadGLTFBufferView<T, S>(ctx, resource, index, thread, shared);

  resource.bufferViewPromises.set(index, { thread, promise, shared });

  return promise;
}

async function _loadGLTFBufferView<T extends Thread, S extends boolean>(
  ctx: GameState,
  resource: GLTFResource,
  index: number,
  thread: T,
  shared: boolean
): Promise<RemoteBufferView<T, S extends true ? SharedArrayBuffer : undefined>> {
  if (!resource.root.bufferViews || !resource.root.bufferViews[index]) {
    throw new Error(`BufferView ${index} not found`);
  }

  const bufferView = resource.root.bufferViews[index];
  const buffer = await loadGLTFBuffer(resource, bufferView.buffer);

  const bufferViewData = shared ? new SharedArrayBuffer(bufferView.byteLength) : new ArrayBuffer(bufferView.byteLength);
  const readView = new Uint8Array(buffer, bufferView.byteOffset || 0, bufferView.byteLength);
  const writeView = new Uint8Array(bufferViewData);
  writeView.set(readView);

  const remoteBufferView = createRemoteBufferView(ctx, {
    name: bufferView.name,
    thread,
    buffer: bufferViewData,
    byteStride: bufferView.byteStride,
  });

  resource.bufferViews.set(index, remoteBufferView);

  return remoteBufferView as RemoteBufferView<T, S extends true ? SharedArrayBuffer : undefined>;
}

export async function loadGLTFImage(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteImage> {
  let imagePromise = resource.imagePromises.get(index);

  if (imagePromise) {
    return imagePromise;
  }

  imagePromise = _loadGLTFImage(ctx, resource, index);

  resource.imagePromises.set(index, imagePromise);

  return imagePromise;
}

async function _loadGLTFImage(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteImage> {
  if (!resource.root.images || !resource.root.images[index]) {
    throw new Error(`Image ${index} not found`);
  }

  const image = resource.root.images[index];

  let remoteImage: RemoteImage;

  if (image.uri) {
    remoteImage = createRemoteImage(ctx, { name: image.name, uri: resolveURL(image.uri, resource.baseUrl) });
  } else if (image.bufferView !== undefined) {
    if (!image.mimeType) {
      throw new Error(`image[${index}] has a bufferView but no mimeType`);
    }

    const remoteBufferView = await loadGLTFBufferView(ctx, resource, image.bufferView, Thread.Render, false);

    remoteImage = createRemoteImageFromBufferView(ctx, {
      name: image.name,
      bufferView: remoteBufferView,
      mimeType: image.mimeType,
    });
  } else {
    throw new Error(`image[${index}] has no uri or bufferView`);
  }

  resource.images.set(index, remoteImage);

  return remoteImage;
}

export async function loadGLTFSampler(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteSampler> {
  let samplerPromise = resource.samplerPromises.get(index);

  if (samplerPromise) {
    return samplerPromise;
  }

  samplerPromise = _loadGLTFSampler(ctx, resource, index);

  resource.samplerPromises.set(index, samplerPromise);

  return samplerPromise;
}

export async function _loadGLTFSampler(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteSampler> {
  if (!resource.root.samplers || !resource.root.samplers[index]) {
    throw new Error(`Sampler ${index} not found`);
  }

  const sampler = resource.root.samplers[index];

  const remoteSampler = createRemoteSampler(ctx, {
    name: sampler.name,
    magFilter: sampler.magFilter,
    minFilter: sampler.minFilter,
    wrapS: sampler.wrapS,
    wrapT: sampler.wrapT,
  });

  resource.samplers.set(index, remoteSampler);

  return remoteSampler;
}

export async function loadGLTFTexture(
  ctx: GameState,
  resource: GLTFResource,
  index: number,
  encoding?: TextureEncoding
): Promise<RemoteTexture> {
  let texturePromise = resource.texturePromises.get(index);

  if (texturePromise) {
    return texturePromise;
  }

  texturePromise = _loadGLTFTexture(ctx, resource, index, encoding);

  resource.texturePromises.set(index, texturePromise);

  return texturePromise;
}

async function _loadGLTFTexture(
  ctx: GameState,
  resource: GLTFResource,
  index: number,
  encoding?: TextureEncoding
): Promise<RemoteTexture> {
  if (!resource.root.textures || !resource.root.textures[index]) {
    throw new Error(`Texture ${index} not found`);
  }

  const texture = resource.root.textures[index];

  if (texture.source === undefined) {
    throw new Error(`texture[${index}].source is undefined.`);
  }

  if (texture.sampler === undefined) {
    throw new Error(`texture[${index}].sampler is undefined.`);
  }

  const { image, sampler } = await promiseObject({
    image: loadGLTFImage(ctx, resource, texture.source),
    sampler: loadGLTFSampler(ctx, resource, texture.sampler),
  });

  const remoteTexture = createRemoteTexture(ctx, {
    name: texture.name,
    image,
    encoding,
    sampler,
  });

  resource.textures.set(index, remoteTexture);

  return remoteTexture;
}

export async function loadGLTFMaterial(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteMaterial> {
  let materialPromise = resource.materialPromises.get(index);

  if (materialPromise) {
    return materialPromise;
  }

  materialPromise = _loadGLTFMaterial(ctx, resource, index);

  resource.materialPromises.set(index, materialPromise);

  return materialPromise;
}

const GLTFAlphaModes: { [key: string]: MaterialAlphaMode } = {
  OPAQUE: MaterialAlphaMode.OPAQUE,
  MASK: MaterialAlphaMode.MASK,
  BLEND: MaterialAlphaMode.BLEND,
};

async function _loadGLTFMaterial(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteMaterial> {
  if (!resource.root.materials || !resource.root.materials[index]) {
    throw new Error(`Material ${index} not found`);
  }

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
  } = resource.root.materials[index];

  let remoteMaterial: RemoteMaterial;

  if (extensions?.KHR_materials_unlit) {
    const { baseColorTexture } = await promiseObject({
      baseColorTexture:
        pbrMetallicRoughness?.baseColorTexture?.index !== undefined
          ? loadGLTFTexture(ctx, resource, pbrMetallicRoughness?.baseColorTexture?.index, TextureEncoding.sRGB)
          : undefined,
    });
    remoteMaterial = createRemoteUnlitMaterial(ctx, {
      name,
      doubleSided,
      alphaMode: alphaMode ? GLTFAlphaModes[alphaMode] : undefined,
      alphaCutoff,
      baseColorFactor: pbrMetallicRoughness?.baseColorFactor,
      baseColorTexture,
    });
  } else {
    const {
      baseColorTexture,
      metallicRoughnessTexture,
      normalTexture: _normalTexture,
      occlusionTexture: _occlusionTexture,
      emissiveTexture: _emissiveTexture,
    } = await promiseObject({
      baseColorTexture:
        pbrMetallicRoughness?.baseColorTexture?.index !== undefined
          ? loadGLTFTexture(ctx, resource, pbrMetallicRoughness?.baseColorTexture?.index, TextureEncoding.sRGB)
          : undefined,
      metallicRoughnessTexture:
        pbrMetallicRoughness?.metallicRoughnessTexture?.index !== undefined
          ? loadGLTFTexture(ctx, resource, pbrMetallicRoughness?.metallicRoughnessTexture?.index)
          : undefined,
      normalTexture:
        normalTexture?.index !== undefined ? loadGLTFTexture(ctx, resource, normalTexture?.index) : undefined,
      occlusionTexture:
        occlusionTexture?.index !== undefined ? loadGLTFTexture(ctx, resource, occlusionTexture?.index) : undefined,
      emissiveTexture:
        emissiveTexture?.index !== undefined
          ? loadGLTFTexture(ctx, resource, emissiveTexture?.index, TextureEncoding.sRGB)
          : undefined,
    });
    remoteMaterial = createRemoteStandardMaterial(ctx, {
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
      emissiveTexture: _emissiveTexture,
    });
  }

  resource.materials.set(index, remoteMaterial);

  return remoteMaterial;
}

export async function loadGLTFAudio(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteAudioData> {
  let audioPromise = resource.audioPromises.get(index);

  if (audioPromise) {
    return audioPromise;
  }

  audioPromise = _loadGLTFAudio(ctx, resource, index);

  resource.audioPromises.set(index, audioPromise);

  return audioPromise;
}

async function _loadGLTFAudio(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteAudioData> {
  if (!resource.root.extensions?.KHR_audio) {
    throw new Error("glTF file has no KHR_audio extension");
  }

  const audioExtension = resource.root.extensions?.KHR_audio;

  if (!audioExtension.audio || !audioExtension.audio[index]) {
    throw new Error(`Audio ${index} not found`);
  }

  const audio = audioExtension.audio[index];

  let remoteAudio: RemoteAudioData;

  if (audio.uri) {
    remoteAudio = createRemoteAudioData(ctx, { name: audio.name, uri: resolveURL(audio.uri, resource.baseUrl) });
  } else if (audio.bufferView !== undefined) {
    if (!audio.mimeType) {
      throw new Error(`audio[${index}] has a bufferView but no mimeType`);
    }

    const remoteBufferView = await loadGLTFBufferView(ctx, resource, audio.bufferView, Thread.Main, false);

    remoteAudio = createRemoteAudioFromBufferView(ctx, {
      name: audio.name,
      bufferView: remoteBufferView,
      mimeType: audio.mimeType,
    });
  } else {
    throw new Error(`audio[${index}] has no uri or bufferView`);
  }

  resource.audio.set(index, remoteAudio);

  return remoteAudio;
}

export async function loadGLTFAudioSource(
  ctx: GameState,
  resource: GLTFResource,
  index: number
): Promise<RemoteAudioSource> {
  let audioSourcePromise = resource.audioSourcePromises.get(index);

  if (audioSourcePromise) {
    return audioSourcePromise;
  }

  audioSourcePromise = _loadGLTFAudioSource(ctx, resource, index);

  resource.audioSourcePromises.set(index, audioSourcePromise);

  return audioSourcePromise;
}

async function _loadGLTFAudioSource(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteAudioSource> {
  if (!resource.root.extensions?.KHR_audio) {
    throw new Error("glTF file has no KHR_audio extension");
  }

  const audioExtension = resource.root.extensions?.KHR_audio;

  if (!audioExtension.sources || !audioExtension.sources[index]) {
    throw new Error(`AudioSource ${index} not found`);
  }

  const audioSource = audioExtension.sources[index];

  const remoteAudioSource = createRemoteAudioSource(ctx, {
    name: audioSource.name,
    gain: audioSource.gain,
    loop: audioSource.loop,
    autoPlay: audioSource.autoPlay,
    audio: audioSource.audio !== undefined ? await loadGLTFAudio(ctx, resource, audioSource.audio) : undefined,
  });

  resource.audioSources.set(index, remoteAudioSource);

  return remoteAudioSource;
}

export async function loadGLTFAudioEmitter(
  ctx: GameState,
  resource: GLTFResource,
  index: number,
  output: AudioEmitterOutput = AudioEmitterOutput.Environment
): Promise<RemoteAudioEmitter> {
  const result = resource.audioEmitterPromises.get(index);

  if (result) {
    if (result.output !== output) {
      throw new Error(`AudioEmitter output ${output} does not match output ${result.output} of existing emitter.`);
    }

    return result.promise;
  }

  const promise = _loadGLTFAudioEmitter(ctx, resource, index, output);

  resource.audioEmitterPromises.set(index, { output, promise });

  return promise;
}

async function _loadGLTFAudioEmitter(
  ctx: GameState,
  resource: GLTFResource,
  index: number,
  output: AudioEmitterOutput
): Promise<RemoteAudioEmitter> {
  if (!resource.root.extensions?.KHR_audio) {
    throw new Error("glTF file has no KHR_audio extension");
  }

  const audioExtension = resource.root.extensions?.KHR_audio;

  if (!audioExtension.emitters || !audioExtension.emitters[index]) {
    throw new Error(`AudioEmitter ${index} not found`);
  }

  const audioEmitter = audioExtension.emitters[index];

  let remoteAudioEmitter: RemoteAudioEmitter;

  const sources = audioEmitter.sources
    ? await Promise.all(audioEmitter.sources.map((sourceIndex) => loadGLTFAudioSource(ctx, resource, sourceIndex)))
    : [];

  if (audioEmitter.type === "global") {
    remoteAudioEmitter = createRemoteGlobalAudioEmitter(ctx, {
      name: audioEmitter.name,
      gain: audioEmitter.gain,
      sources,
      output,
    });
  } else if (audioEmitter.type === "positional") {
    remoteAudioEmitter = createRemotePositionalAudioEmitter(ctx, {
      name: audioEmitter.name,
      coneInnerAngle: audioEmitter.coneInnerAngle,
      coneOuterAngle: audioEmitter.coneOuterAngle,
      coneOuterGain: audioEmitter.coneOuterGain,
      distanceModel: audioEmitter.distanceModel,
      maxDistance: audioEmitter.maxDistance,
      refDistance: audioEmitter.refDistance,
      rolloffFactor: audioEmitter.rolloffFactor,
      gain: audioEmitter.gain,
      sources,
      output,
    });
  } else {
    throw new Error(`Unknown audio emitter type ${audioEmitter.type}`);
  }

  resource.audioEmitters.set(index, remoteAudioEmitter);

  return remoteAudioEmitter;
}

export async function loadGLTFAccessor(
  ctx: GameState,
  resource: GLTFResource,
  index: number
): Promise<RemoteAccessor<any, any>> {
  let accessorPromise = resource.accessorPromises.get(index);

  if (accessorPromise) {
    return accessorPromise;
  }

  accessorPromise = _loadGLTFAccessor(ctx, resource, index);

  resource.accessorPromises.set(index, accessorPromise);

  return accessorPromise;
}

async function _loadGLTFAccessor(
  ctx: GameState,
  resource: GLTFResource,
  index: number
): Promise<RemoteAccessor<any, any>> {
  if (!resource.root.accessors || !resource.root.accessors[index]) {
    throw new Error(`Accessor ${index} not found`);
  }

  const accessor = resource.root.accessors[index];

  const { bufferView, sparseValuesBufferView, sparseIndicesBufferView } = await promiseObject({
    bufferView:
      accessor.bufferView !== undefined
        ? loadGLTFBufferView(ctx, resource, accessor.bufferView, Thread.Render, true)
        : undefined,
    sparseValuesBufferView:
      accessor.sparse?.values !== undefined
        ? loadGLTFBufferView(ctx, resource, accessor.sparse.values.bufferView, Thread.Render, true)
        : undefined,
    sparseIndicesBufferView:
      accessor.sparse?.indices !== undefined
        ? loadGLTFBufferView(ctx, resource, accessor.sparse.indices.bufferView, Thread.Render, true)
        : undefined,
  });

  if (accessor.sparse && (!sparseIndicesBufferView || !sparseValuesBufferView)) {
    throw new Error("Sparse accessor missing bufferViews");
  }

  const remoteAccessor = createRemoteAccessor(ctx, {
    name: accessor.name,
    bufferView,
    type: accessor.type,
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

  const remoteMesh = createRemoteMesh(ctx, { name: mesh.name, primitives });

  resource.meshes.set(index, remoteMesh);

  return remoteMesh;
}

async function _createGLTFMeshPrimitive(
  ctx: GameState,
  resource: GLTFResource,
  primitive: GLTFMeshPrimitive
): Promise<MeshPrimitiveProps> {
  const attributesPromises: { [key: string]: Promise<RemoteAccessor<any, any>> } = {};

  for (const key in primitive.attributes) {
    attributesPromises[key] = loadGLTFAccessor(ctx, resource, primitive.attributes[key]);
  }

  const { indices, attributes, material } = await promiseObject({
    indices: primitive.indices !== undefined ? loadGLTFAccessor(ctx, resource, primitive.indices) : undefined,
    attributes: promiseObject(attributesPromises),
    material: primitive.material !== undefined ? loadGLTFMaterial(ctx, resource, primitive.material) : undefined,
  });

  return {
    indices,
    attributes,
    material,
    mode: primitive.mode,
  };
}

async function _loadGLTFInstancedMesh(
  ctx: GameState,
  resource: GLTFResource,
  node: GLTFNode,
  extension: GLTFInstancedMeshExtension
): Promise<RemoteInstancedMesh> {
  const attributesPromises: { [key: string]: Promise<RemoteAccessor<any, any>> } = {};

  for (const key in extension.attributes) {
    attributesPromises[key] = loadGLTFAccessor(ctx, resource, extension.attributes[key]);
  }

  const attributes = await promiseObject(attributesPromises);

  return createRemoteInstancedMesh(ctx, { name: `${node.name} Instanced Mesh`, attributes });
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
    remoteCamera = createRemotePerspectiveCamera(ctx, {
      name: camera.name,
      aspectRatio: camera.perspective.aspectRatio,
      yfov: camera.perspective.yfov,
      zfar: camera.perspective.zfar,
      znear: camera.perspective.znear,
    });
  } else if (camera.orthographic) {
    remoteCamera = createRemoteOrthographicCamera(ctx, {
      name: camera.name,
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

export async function loadGLTFLight(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteLight> {
  let lightPromise = resource.lightPromises.get(index);

  if (lightPromise) {
    return lightPromise;
  }

  lightPromise = _loadGLTFLight(ctx, resource, index);

  resource.lightPromises.set(index, lightPromise);

  return lightPromise;
}

async function _loadGLTFLight(ctx: GameState, resource: GLTFResource, index: number): Promise<RemoteLight> {
  if (!resource.root.extensions?.KHR_lights_punctual) {
    throw new Error("glTF file has no KHR_audio extension");
  }

  const lightExtension = resource.root.extensions?.KHR_lights_punctual;

  if (!lightExtension.lights || !lightExtension.lights[index]) {
    throw new Error(`Light ${index} not found`);
  }

  const light = lightExtension.lights[index];

  const color = light.color ? vec3.fromValues(light.color[0], light.color[1], light.color[2]) : vec3.create();
  const intensity = light.intensity;
  const range = light.range;

  let remoteLight: RemoteLight;

  if (light.type === GLTFLightType.Directional) {
    remoteLight = createDirectionalLightResource(ctx, {
      name: light.name,
      color,
      intensity,
    });
  } else if (light.type === GLTFLightType.Point) {
    remoteLight = createPointLightResource(ctx, {
      name: light.name,
      color,
      intensity,
      range,
    });
  } else if (light.type === GLTFLightType.Spot) {
    remoteLight = createSpotLightResource(ctx, {
      name: light.name,
      color,
      intensity,
      range,
      innerConeAngle: light.spot?.innerConeAngle,
      outerConeAngle: light.spot?.outerConeAngle,
    });
  } else {
    throw new Error("Light was of unknown type");
  }

  resource.lights.set(index, remoteLight);

  return remoteLight;
}
