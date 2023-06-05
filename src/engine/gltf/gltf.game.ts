import { addComponent, defineQuery, exitQuery } from "bitecs";
import { glMatrix, mat4, quat } from "gl-matrix";
import RAPIER from "@dimforge/rapier3d-compat";
import { AnimationAction, AnimationClip, AnimationMixer, Bone, Group, Object3D, SkinnedMesh } from "three";

import { SpawnPoint } from "../component/SpawnPoint";
import { addChild, traverse, updateMatrix, updateMatrixWorld } from "../component/transform";
import { GameState, RemoteResourceManager, World } from "../GameTypes";
import resolveURL from "../utils/resolveURL";
import {
  GLTFRoot,
  GLTFMeshPrimitive,
  GLTFInstancedMeshExtension,
  GLTFLightmap,
  GLTFChildOfRootProperty,
  GLTFAudioEmitterPositional,
  GLTFHubsComponents,
  GLTFLink,
  GLTFPortal,
  GLTFTilesRenderer,
  GLTFCharacterController,
  GLTFAnimationChannel,
  GLTFAnimationSampler,
  GLTFComponentDefinitions,
  GLTFNodeComponents,
  GLTFPhysicsBody,
} from "./GLTF";
import { fetchWithProgress } from "../utils/fetchWithProgress.game";
import {
  AccessorType,
  CameraType,
  LightType,
  MaterialAlphaMode,
  MaterialType,
  SamplerMapping,
  TextureEncoding,
  MeshPrimitiveAttributeIndex,
  InstancedMeshAttributeIndex,
  AudioEmitterOutput,
  AudioEmitterType,
  AudioEmitterDistanceModel,
  ResourceType,
  AnimationChannelTargetPath,
  AnimationSamplerInterpolation,
  TextureFormat,
  ColliderType,
  PhysicsBodyType,
} from "../resource/schema";
import { toSharedArrayBuffer } from "../utils/arraybuffer";
import {
  RemoteAccessor,
  RemoteAnimation,
  RemoteAnimationChannel,
  RemoteAnimationSampler,
  RemoteAudioData,
  RemoteAudioEmitter,
  RemoteAudioSource,
  RemoteBuffer,
  RemoteBufferView,
  RemoteCamera,
  RemoteCollider,
  RemoteImage,
  RemoteInstancedMesh,
  RemoteLight,
  RemoteLightMap,
  RemoteMaterial,
  RemoteMesh,
  RemoteMeshPrimitive,
  RemoteNode,
  RemotePhysicsBody,
  RemoteReflectionProbe,
  RemoteSampler,
  RemoteScene,
  RemoteSkin,
  RemoteSparseAccessor,
  RemoteTexture,
  RemoteTilesRenderer,
} from "../resource/RemoteResources";
import { addPortalComponent } from "../../plugins/portals/portals.game";
import { getModule } from "../module/module.common";
import { addNodePhysicsBody, addRigidBody, PhysicsModule } from "../physics/physics.game";
import { getAccessorArrayView, vec3ArrayTransformMat4 } from "../accessor/accessor.common";
import { staticRigidBodyCollisionGroups } from "../physics/CollisionGroups";
import { CharacterControllerType, SceneCharacterControllerComponent } from "../player/CharacterController";
import { loadGLTFAnimationClip } from "./animation.three";
import { AnimationComponent, BoneComponent } from "../animation/animation.game";
import { RemoteResource } from "../resource/RemoteResourceClass";
import { getRotationNoAlloc } from "../utils/getRotationNoAlloc";
import { TypedArray32 } from "../utils/typedarray";

/**
 * GLTFResource stores references to all of the resources loaded from a glTF file.
 * It needs to be disposed when you're done with it. Nodes/Scenes are not cached in a GLTFResource.
 * You can create multiple instances of a GLTFResource, so Nodes/Scenes can't be cached in it.
 **/
export interface GLTFResource {
  /**
   * Full canonical url of the glTF resource
   **/
  url: string;
  /**
   * Root path (excluding file and extension) of the glTF resource
   **/
  baseUrl: string;
  /**
   * Map from uri to blob uri for resources loaded off the game thread.
   **/
  fileMap: Map<string, string>;
  /**
   * JSON chunk of the glTF resource
   **/
  root: GLTFRoot;
  /**
   * Buffer data keyed by buffer index
   **/
  buffers: Map<number, SharedArrayBuffer>;
  /**
   * Map of resource name to GLTFSubResourceCache.
   * Used as a dependency graph and for creating multiple instances of a GLTFResource
   **/
  caches: Map<string, GLTFSubresourceCache>;
  /**
   * ResourceManager used when creating subresources for this GLTFResource.
   * Can be the global GameResourceManager or per-script ScriptResourceManager.
   */
  manager: RemoteResourceManager;
}

export interface LoadGLTFOptions {
  /**
   * ResourceManager to use when loading glTF. Defaults to global GameResourceManager
   */
  resourceManager?: RemoteResourceManager;
  /**
   * Map from blob to uris used in glTF
   **/
  fileMap?: Map<string, string>;
  /**
   * AbortSignal to use to cancel loading glTF resource
   */
  signal?: AbortSignal;
}

/**
 * Load a GLTFResource from a .gltf or .glb uri
 */
export async function loadGLTF(ctx: GameState, uri: string, options?: LoadGLTFOptions): Promise<GLTFResource> {
  const url = new URL(uri, self.location.href);

  const resourceManager = options?.resourceManager || ctx.resourceManager;

  const entry = resourceManager.gltfCache.get(url.href);

  if (entry) {
    entry.refCount++;
    return entry.promise;
  }

  const promise = loadGLTFResource(ctx, resourceManager, url.href, options);

  resourceManager.gltfCache.set(url.href, {
    promise,
    refCount: 1,
  });

  return promise;
}

/**
 * Remove a reference to the passed GLTFResource.
 * Returns true if the GLTFResource was disposed and false if it was not.
 * If GLTFResource is disposed object urls will be revoked and all cached
 * resources will have their references removed.
 */
function removeGLTFResourceRef(resource: GLTFResource): boolean {
  const cacheKey = resource.url;
  const gltfCache = resource.manager.gltfCache;
  const entry = gltfCache.get(cacheKey);

  if (entry && --entry.refCount <= 0) {
    gltfCache.delete(cacheKey);

    for (const cache of resource.caches.values()) {
      for (const entry of cache.values()) {
        entry.removeRef();
      }
    }

    URL.revokeObjectURL(resource.url);

    for (const objectUrl of resource.fileMap.values()) {
      URL.revokeObjectURL(objectUrl);
    }

    return true;
  }

  return false;
}

const GLTFResourceComponent = new Map<number, GLTFResource>();

function addGLTFResourceComponent(world: World, eid: number, resource: GLTFResource) {
  addComponent(world, GLTFResourceComponent, eid);
  GLTFResourceComponent.set(eid, resource);
}

const gltfResourceQuery = defineQuery([GLTFResourceComponent]);
const gltfResourceExitQuery = exitQuery(gltfResourceQuery);

export function GLTFResourceDisposalSystem(ctx: GameState) {
  const entities = gltfResourceExitQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const gltfResource = GLTFResourceComponent.get(eid);

    if (gltfResource) {
      removeGLTFResourceRef(gltfResource);
      GLTFResourceComponent.delete(eid);
    }
  }
}

export function createNodeFromGLTFURI(ctx: GameState, uri: string): RemoteNode {
  const node = new RemoteNode(ctx.resourceManager);
  loadGLTF(ctx, uri).then((resource) => loadDefaultGLTFScene(ctx, resource, { existingNode: node }));
  return node;
}

export function loadDefaultGLTFScene(
  ctx: GameState,
  resource: GLTFResource,
  options?: GLTFSceneOptions & GLTFLoaderOptions
) {
  const defaultSceneIndex = resource.root.scene;

  if (defaultSceneIndex === undefined) {
    throw new Error("glTF file has no default scene");
  }

  const loaderCtx = createGLTFLoaderContext(ctx, resource, options);
  const scene = loadGLTFScene(loaderCtx, defaultSceneIndex, options);
  postLoad(loaderCtx, scene);
  addGLTFResourceComponent(ctx.world, scene.eid, resource);
  return scene;
}

const GLB_HEADER_BYTE_LENGTH = 12;
const GLB_MAGIC = 0x46546c67; // "glTF" in ASCII

async function loadGLTFResource(
  ctx: GameState,
  resourceManager: RemoteResourceManager,
  url: string,
  options?: LoadGLTFOptions
) {
  const res = await fetchWithProgress(ctx, url, { signal: options?.signal });

  const buffer = await res.arrayBuffer();

  // https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#binary-header
  const header = new DataView(buffer, 0, GLB_HEADER_BYTE_LENGTH);
  const isGLB = header.getUint32(0, true) === GLB_MAGIC;
  const version = header.getUint32(4, true);

  if (version < 2) {
    throw new Error(`Unsupported glb version: ${version}`);
  }

  let resource: GLTFResource;

  if (isGLB) {
    resource = await loadGLTFBinary(ctx, resourceManager, buffer, url, options);
  } else {
    const jsonStr = new TextDecoder().decode(buffer);
    const json = JSON.parse(jsonStr);
    resource = await loadGLTFJSON(ctx, resourceManager, json, url, undefined, options);
  }

  loadGLTFResourceExtensions(resource);

  return resource;
}

const ChunkType = {
  JSON: 0x4e4f534a,
  Bin: 0x004e4942,
};

const CHUNK_HEADER_BYTE_LENGTH = 8;

async function loadGLTFBinary(
  ctx: GameState,
  resourceManager: RemoteResourceManager,
  buffer: ArrayBuffer,
  url: string,
  options?: LoadGLTFOptions
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

  return loadGLTFJSON(ctx, resourceManager, jsonChunkData, url, binChunkData, options);
}

async function loadGLTFJSON(
  ctx: GameState,
  resourceManager: RemoteResourceManager,
  json: unknown,
  url: string,
  binaryChunk?: SharedArrayBuffer,
  options?: LoadGLTFOptions
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
    fileMap: options?.fileMap || new Map(),
    baseUrl,
    root,
    buffers: new Map(),
    caches: new Map(),
    manager: resourceManager,
  };

  if (resource.root.buffers) {
    await Promise.all(
      resource.root.buffers.map(async ({ uri }, index) => {
        let data: SharedArrayBuffer;

        if (uri) {
          const filePath = resource.fileMap.get(uri) || uri;
          const url = resolveURL(filePath, resource.baseUrl);
          const response = await fetch(url, { signal: options?.signal });
          const bufferData = await response.arrayBuffer();
          data = toSharedArrayBuffer(bufferData);
        } else if (index === 0 && binaryChunk) {
          data = binaryChunk;
        } else {
          throw new Error(`Invalid buffer at index ${index}`);
        }

        resource.buffers.set(index, data);
      })
    );
  }

  return resource;
}

export interface GLTFLoaderOptions {
  audioOutput?: AudioEmitterOutput;
  createDefaultMeshColliders?: boolean;
  rootIsStatic?: boolean;
}

/**
 * Context used for the loading of a Scene / Node hierarchy.
 * tempCache is only used for resources that are referenced when building this hierarchy
 */
export type GLTFLoaderContext = {
  ctx: GameState;
  resource: GLTFResource;
  nodeIndexMap: Map<RemoteNode, number>;
  nodeMap: Map<number, RemoteNode>;
  nodeToObject3D: Map<RemoteNode, Object3D>;
  tempCache: Map<string, GLTFSubresourceCache>;
  postLoadCallbacks: GLTFPostLoadCallback[];
  useMXStatic: boolean;
} & GLTFLoaderOptions;

const createGLTFLoaderContext = (
  ctx: GameState,
  resource: GLTFResource,
  options?: GLTFLoaderOptions
): GLTFLoaderContext => ({
  ctx,
  resource,
  nodeMap: new Map(),
  nodeIndexMap: new Map(),
  nodeToObject3D: new Map(),
  tempCache: new Map(),
  postLoadCallbacks: [],
  useMXStatic: (options?.rootIsStatic && resource.root.extensionsUsed?.includes("MX_static")) || false,
  ...options,
});

/**
 * Map from subresource index to cache entry.
 */
type GLTFSubresourceCache = Map<number, RemoteResource>;

type GLTFSubresourceLoader<
  LoaderContext extends GLTFResource | GLTFLoaderContext,
  Prop extends GLTFChildOfRootProperty,
  Subresource extends RemoteResource,
  Options
> = (loaderCtx: LoaderContext, property: Prop, index: number, options?: Options) => Subresource;

function loadSubresource<
  LoaderContext extends GLTFResource | GLTFLoaderContext,
  Prop extends GLTFChildOfRootProperty,
  Subresource extends RemoteResource,
  Options
>(
  loaderCtx: LoaderContext,
  caches: Map<string, GLTFSubresourceCache>,
  shouldAddRef: boolean,
  resource: GLTFResource,
  key: string,
  selector: (root: GLTFRoot) => Prop[] | undefined,
  loader: GLTFSubresourceLoader<LoaderContext, Prop, Subresource, Options>,
  index: number,
  options?: Options
): Subresource {
  const properties = selector(resource.root);
  const property = properties ? properties[index] : undefined;

  if (!property) {
    throw new Error(`${key} ${index} not found`);
  }

  let cache = caches.get(key);

  if (!cache) {
    cache = new Map();
    caches.set(key, cache);
  }

  let subresource = cache.get(index);

  if (subresource) {
    return subresource as Subresource;
  }

  subresource = loader(loaderCtx, property, index, options);

  if (shouldAddRef) {
    subresource.addRef();
  }

  cache.set(index, subresource);

  return subresource as Subresource;
}

/**
 * Creates a subresource loader that uses an ephemeral GLTFLoader context that only exists while loading
 * the requested scene/node subresource.
 */
const createInstancedSubresourceLoader =
  <Prop extends GLTFChildOfRootProperty, Subresource extends RemoteResource, Options = undefined>(
    key: string,
    selector: (root: GLTFRoot) => Prop[] | undefined,
    loader: GLTFSubresourceLoader<GLTFLoaderContext, Prop, Subresource, Options>
  ) =>
  (loaderCtx: GLTFLoaderContext, index: number, options?: Options): Subresource =>
    loadSubresource(loaderCtx, loaderCtx.tempCache, false, loaderCtx.resource, key, selector, loader, index, options);

/**
 * Creates a subresource loader that caches subresources in the provided GLTFResource. The GLTFResource
 * holds references to the loaded subresource and can only be disposed when the GLTFResource is disposed.
 */
const createCachedSubresourceLoader =
  <Prop extends GLTFChildOfRootProperty, Subresource extends RemoteResource, Options = undefined>(
    key: string,
    selector: (root: GLTFRoot) => Prop[] | undefined,
    loader: GLTFSubresourceLoader<GLTFResource, Prop, Subresource, Options>
  ) =>
  (resource: GLTFResource, index: number, options?: Options): Subresource =>
    loadSubresource(resource, resource.caches, true, resource, key, selector, loader, index, options);

function resolveGLTFURI(resource: GLTFResource, uri: string) {
  return resolveURL(resource.fileMap.get(uri) || uri, resource.baseUrl);
}

type GLTFPostLoadCallback = () => void;

function loadGLTFComponentDefinitions(resourceManager: RemoteResourceManager, extension: GLTFComponentDefinitions) {
  for (const componentDef of extension.definitions) {
    const componentId = resourceManager.nextComponentId++;
    resourceManager.componentDefinitions.set(componentId, componentDef);
    resourceManager.componentIdsByName.set(componentDef.name, componentId);
  }
}

function loadGLTFResourceExtensions(gltf: GLTFResource) {
  if (gltf.root.extensions?.MX_components) {
    loadGLTFComponentDefinitions(gltf.manager, gltf.root.extensions.MX_components);
  }
}

function loadGLTFCharacterController(
  { ctx }: GLTFLoaderContext,
  extension: GLTFCharacterController,
  scene: RemoteScene
) {
  const type = extension.type;

  if (type === undefined) {
    return;
  }

  addComponent(ctx.world, SceneCharacterControllerComponent, scene.eid);
  SceneCharacterControllerComponent.set(scene.eid, {
    type: type as CharacterControllerType,
  });
}

function loadGLTFSceneAnimations(loaderCtx: GLTFLoaderContext, remoteSceneOrNode: RemoteScene | RemoteNode) {
  const { ctx, resource } = loaderCtx;
  const animationDefs = resource.root.animations || [];

  if (animationDefs.length > 0) {
    const world = ctx.world;
    const joints = new Set<number>();
    const nodeToObject3D = loaderCtx.nodeToObject3D;

    if (resource.root.skins) {
      for (const skin of resource.root.skins) {
        for (const jointIndex of skin.joints) {
          joints.add(jointIndex);
        }
      }
    }

    const rootObj = new Group();

    traverse(remoteSceneOrNode, (node) => {
      if (node === remoteSceneOrNode) {
        nodeToObject3D.set(node, rootObj);
        return;
      }

      const nodeIndex = loaderCtx.nodeIndexMap.get(node);

      if (nodeIndex === undefined) {
        return false;
      }

      const isBone = joints.has(nodeIndex);

      let obj: Object3D;

      if (node.mesh !== undefined && node.skin !== undefined) {
        obj = new SkinnedMesh();
      } else if (isBone) {
        const bone = new Bone();
        addComponent(world, BoneComponent, node.eid);
        BoneComponent.set(node.eid, bone);
        obj = bone;
      } else {
        obj = new Object3D();
      }

      nodeToObject3D.set(node, obj);

      obj.position.fromArray(node.position);
      obj.quaternion.fromArray(node.quaternion);
      obj.scale.fromArray(node.scale);

      const parentObj = node.parent && nodeToObject3D.get(node.parent);

      if (!parentObj) {
        throw new Error("Node has no parent");
      }

      parentObj.add(obj);
    });

    const animations = animationDefs.map((v, i) => loadGLTFAnimation(loaderCtx, i));
    const mixer = new AnimationMixer(rootObj);
    const actionMap = new Map<string, AnimationAction>();
    const actions: AnimationAction[] = [];
    for (const animation of animations) {
      const action = mixer.clipAction(animation.clip as AnimationClip).play();
      action.enabled = false;
      actionMap.set(animation.name, action);
      actions.push(action);
    }
    addComponent(world, AnimationComponent, remoteSceneOrNode.eid);
    AnimationComponent.set(remoteSceneOrNode.eid, {
      animations,
      mixer,
      actionMap,
      actions,
    });
  }
}

function postLoad(loaderCtx: GLTFLoaderContext, root: RemoteScene | RemoteNode) {
  updateMatrixWorld(root, true);

  for (const postLoadCallback of loaderCtx.postLoadCallbacks) {
    postLoadCallback();
  }
}

interface GLTFSceneOptions {
  existingNode?: RemoteNode;
  existingScene?: RemoteScene;
}

const loadGLTFScene = createInstancedSubresourceLoader(
  "scene",
  (root) => root.scenes,
  (loaderCtx, { name, nodes: nodeIndices, extensions }, index, options?: GLTFSceneOptions) => {
    const resource = loaderCtx.resource;

    const nodes = nodeIndices ? nodeIndices.map((index) => loadGLTFNode(loaderCtx, index)) : [];

    let remoteSceneOrNode: RemoteScene | RemoteNode | undefined;

    if (options?.existingNode) {
      remoteSceneOrNode = options.existingNode;
    } else {
      const { audioEmitters, backgroundTexture, reflectionProbe } = {
        audioEmitters:
          extensions?.KHR_audio?.emitters !== undefined
            ? extensions.KHR_audio.emitters.map((index) => loadGLTFAudioEmitter(resource, index))
            : undefined,
        backgroundTexture: extensions?.MX_background?.backgroundTexture
          ? loadGLTFTexture(resource, extensions.MX_background.backgroundTexture.index, {
              mapping: SamplerMapping.EquirectangularReflectionMapping,
              encoding: TextureEncoding.sRGB,
              flipY: true,
            })
          : undefined,
        reflectionProbe: extensions?.MX_reflection_probes
          ? loadGLTFReflectionProbe(resource, extensions.MX_reflection_probes.reflectionProbe)
          : undefined,
      };

      const bloom = extensions?.MX_postprocessing?.bloom;

      if (options?.existingScene) {
        remoteSceneOrNode = options?.existingScene;
        remoteSceneOrNode.audioEmitters = audioEmitters || [];
        remoteSceneOrNode.backgroundTexture = backgroundTexture;
        remoteSceneOrNode.reflectionProbe = reflectionProbe;

        if (bloom !== undefined) {
          if (bloom.strength !== undefined) {
            remoteSceneOrNode.bloomStrength = bloom.strength;
          }

          if (bloom.radius !== undefined) {
            remoteSceneOrNode.bloomRadius = bloom.radius;
          }

          if (bloom.threshold !== undefined) {
            remoteSceneOrNode.bloomThreshold = bloom.threshold;
          }
        }
      } else {
        remoteSceneOrNode = new RemoteScene(resource.manager, {
          audioEmitters,
          backgroundTexture,
          reflectionProbe,
          bloomStrength: bloom?.strength,
          bloomRadius: bloom?.radius,
          bloomThreshold: bloom?.threshold,
          supportsAR: !!extensions?.MX_scene_ar,
        });
      }
    }

    for (const node of nodes) {
      addChild(remoteSceneOrNode, node);
    }

    updateMatrixWorld(remoteSceneOrNode, true);

    if (remoteSceneOrNode.resourceType == ResourceType.Scene) {
      if (extensions?.MX_character_controller) {
        loadGLTFCharacterController(loaderCtx, extensions.MX_character_controller, remoteSceneOrNode);
      }
    }

    if (resource.root.animations && resource.root.animations.length > 0) {
      loadGLTFSceneAnimations(loaderCtx, remoteSceneOrNode);
    }

    return remoteSceneOrNode;
  }
);

function loadGLTFInstancedMesh(resource: GLTFResource, extension: GLTFInstancedMeshExtension): RemoteInstancedMesh {
  const attributes: { [key: string]: RemoteAccessor } = {};

  for (const key in extension.attributes) {
    const index = InstancedMeshAttributeToIndices[key];
    attributes[index] = loadGLTFAccessor(resource, extension.attributes[key]);
  }

  return new RemoteInstancedMesh(resource.manager, { attributes });
}

function loadGLTFLightMap(resource: GLTFResource, extension: GLTFLightmap): RemoteLightMap {
  const texture = loadGLTFTexture(resource, extension.lightMapTexture.index, {
    encoding: TextureEncoding.Linear,
  });

  return new RemoteLightMap(resource.manager, {
    texture,
    scale: extension.scale,
    offset: extension.offset,
    intensity: extension.intensity,
  });
}

function loadGLTFComponents(loaderCtx: GLTFLoaderContext, extension: GLTFNodeComponents, node: RemoteNode) {
  const resourceManager = loaderCtx.resource.manager;

  for (const componentName in extension) {
    if (componentName === "extras" || componentName === "extensions") {
      continue;
    }

    const componentId = resourceManager.componentIdsByName.get(componentName);

    if (!componentId) {
      console.warn(`Unknown component ${componentName} defined on GLTF node ${node.name}`);
      continue;
    }

    const componentDefinition = resourceManager.componentDefinitions.get(componentId);

    if (!componentDefinition) {
      console.warn(`Unknown component ${componentName} defined on GLTF node ${node.name}`);
      continue;
    }

    const componentProps = extension[componentName];

    const componentStore = resourceManager.componentStores.get(componentId);

    if (!componentStore) {
      console.warn(`Component store for ${componentName} not registered before gltf load. Ignoring.`);
      continue;
    }

    componentStore.add(node.eid);

    if (componentDefinition.props) {
      const nodeIndex = resourceManager.nodeIdToComponentStoreIndex.get(node.eid) || 0;

      for (const propDef of componentDefinition.props) {
        let propValue = componentProps[propDef.name];

        if (propValue === undefined) {
          continue;
        }

        const propStore = componentStore.propsByName.get(propDef.name);

        if (!propStore) {
          console.warn(`Component ${componentDefinition.name} does not have a property ${propDef.name}. Ignoring.`);
          continue;
        }

        if (propDef.type === "ref") {
          if (propDef.refType === "node") {
            const refNode = loadGLTFNode(loaderCtx, propValue as number);
            propValue = refNode.eid;
          } else {
            console.warn(`Unknown ref type ${propDef.refType} for prop ${propDef.name}`);
            continue;
          }
        } else {
          if (propDef.size === 1) {
            propStore[nodeIndex] = propValue as number;
          } else {
            (propStore[nodeIndex] as TypedArray32).set(propValue as number[]);
          }
        }
      }
    }
  }
}

function loadGLTFHubsComponents(loaderCtx: GLTFLoaderContext, extension: GLTFHubsComponents, node: RemoteNode): void {
  if (extension["spawn-point"] || extension["waypoint"]?.canBeSpawnPoint) {
    node.position[1] += 1.6;
    quat.rotateY(node.quaternion, node.quaternion, Math.PI);
    addComponent(loaderCtx.ctx.world, SpawnPoint, node.eid);
  }

  if ((extension["trimesh"] || extension["nav-mesh"]) && node.mesh) {
    addTrimeshFromMesh(loaderCtx, node, node.mesh);
  }

  if (extension.visible?.visible === false) {
    node.visible = false;
  }

  if (extension["scene-preview-camera"]) {
    node.camera = new RemoteCamera(loaderCtx.resource.manager, {
      type: CameraType.Perspective,
      yfov: glMatrix.toRadian(75),
      znear: 0.1,
      zfar: 2000,
    });

    loaderCtx.ctx.worldResource.activeCameraNode = node;
  }
}

function loadGLTFSpawnPoint({ ctx }: GLTFLoaderContext, node: RemoteNode) {
  addComponent(ctx.world, SpawnPoint, node.eid);
}

function addTrimeshFromMesh(loaderCtx: GLTFLoaderContext, node: RemoteNode, mesh: RemoteMesh) {
  const { physicsWorld } = getModule(loaderCtx.ctx, PhysicsModule);

  // TODO: We don't really need the whole RemoteMesh just for a trimesh and tracking
  // the resource is expensive.

  for (const primitive of mesh.primitives) {
    const rigidBodyDesc = RAPIER.RigidBodyDesc.newStatic();
    const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

    const positionsArray = getAccessorArrayView(
      primitive.attributes[MeshPrimitiveAttributeIndex.POSITION] as RemoteAccessor
    ).slice() as Float32Array;
    vec3ArrayTransformMat4(positionsArray, positionsArray, node.worldMatrix);

    let indicesArr: Uint32Array;

    if (primitive.indices) {
      const indicesArrView = getAccessorArrayView(primitive.indices as RemoteAccessor);
      indicesArr = indicesArrView instanceof Uint32Array ? indicesArrView : new Uint32Array(indicesArrView);
    } else {
      indicesArr = new Uint32Array(positionsArray.length / 3);

      for (let i = 0; i < indicesArr.length; i++) {
        indicesArr[i] = i;
      }
    }

    const colliderDesc = RAPIER.ColliderDesc.trimesh(positionsArray, indicesArr);

    colliderDesc.setCollisionGroups(staticRigidBodyCollisionGroups);

    physicsWorld.createCollider(colliderDesc, rigidBody);

    const primitiveNode = new RemoteNode(loaderCtx.resource.manager);
    addChild(node, primitiveNode);
    addRigidBody(loaderCtx.ctx, primitiveNode, rigidBody, mesh, primitive);
  }
}

const gltfColliderTypeToColliderType: { [key: string]: ColliderType } = {
  box: ColliderType.Box,
  sphere: ColliderType.Sphere,
  capsule: ColliderType.Capsule,
  cylinder: ColliderType.Cylinder,
  mesh: ColliderType.Trimesh,
};

const loadGLTFCollider = createCachedSubresourceLoader(
  "collider",
  (root) => root.extensions?.OMI_collider?.colliders,
  (resource, props, index) => {
    const { name, type: typeStr, extents, size, radius, height, isTrigger, mesh: meshIndex } = props;

    let mesh: RemoteMesh | undefined;

    if (meshIndex !== undefined) {
      mesh = loadGLTFMesh(resource, meshIndex);
    }

    const type = gltfColliderTypeToColliderType[typeStr];

    if (type === undefined) {
      throw new Error(`Unknown collider type ${typeStr}`);
    }

    return new RemoteCollider(resource.manager, {
      name,
      type,
      size: extents !== undefined ? [extents[0] * 2, extents[1] * 2, extents[2] * 2] : size,
      radius,
      height,
      mesh,
      isTrigger,
    });
  }
);

function loadDefaultGLTFPhysicsBody(loaderCtx: GLTFLoaderContext, node: RemoteNode) {
  let parentIsPhysicsBody = false;

  if (node.parent) {
    const parentIndex = loaderCtx.nodeIndexMap.get(node.parent);

    if (parentIndex === undefined) {
      throw new Error(`Parent node not found for node ${node.name}`);
    }

    const parentNodeDef = loaderCtx.resource.root.nodes ? loaderCtx.resource.root.nodes[parentIndex] : undefined;

    if (parentNodeDef?.extensions?.OMI_physics_body) {
      parentIsPhysicsBody = true;
    }
  }

  if (!parentIsPhysicsBody) {
    node.physicsBody = new RemotePhysicsBody(loaderCtx.resource.manager, {
      type: PhysicsBodyType.Static,
      mass: 1,
    });
    addNodePhysicsBody(loaderCtx.ctx, node);
  }
}

const gltfPhysicsBodyTypeToPhysicsBodyType: { [key: string]: PhysicsBodyType } = {
  static: PhysicsBodyType.Static,
  kinematic: PhysicsBodyType.Kinematic,
  rigid: PhysicsBodyType.Rigid,
};

function loadGLTFPhysicsBody(loaderCtx: GLTFLoaderContext, node: RemoteNode, physicsBodyDef: GLTFPhysicsBody) {
  const type = gltfPhysicsBodyTypeToPhysicsBodyType[physicsBodyDef.type];

  if (type === undefined) {
    throw new Error(`Unknown physics body type ${physicsBodyDef.type}`);
  }

  node.physicsBody = new RemotePhysicsBody(loaderCtx.resource.manager, {
    type,
    mass: physicsBodyDef.mass,
    linearVelocity: physicsBodyDef.linearVelocity,
    angularVelocity: physicsBodyDef.angularVelocity,
    inertiaTensor: physicsBodyDef.inertiaTensor,
  });
  addNodePhysicsBody(loaderCtx.ctx, node);
}

function loadGLTFTilesRenderer({ resource }: GLTFLoaderContext, node: RemoteNode, extension: GLTFTilesRenderer) {
  node.tilesRenderer = new RemoteTilesRenderer(resource.manager, {
    uri: resolveGLTFURI(resource, extension.tilesetUrl),
  });
}

function loadGLTFLink({ ctx }: GLTFLoaderContext, node: RemoteNode, extension: GLTFLink) {
  addPortalComponent(ctx, node, { uri: extension.uri });
}

function loadGLTFPortal({ ctx }: GLTFLoaderContext, node: RemoteNode, extension: GLTFPortal) {
  addPortalComponent(ctx, node, { uri: extension.uri });
}

const loadGLTFNode = createInstancedSubresourceLoader(
  "node",
  (root) => root.nodes,
  (loaderCtx, nodeDef, index) => {
    const {
      name,
      translation,
      rotation,
      scale,
      matrix,
      children: childIndices,
      camera: cameraIndex,
      mesh: meshIndex,
      skin: skinIndex,
      extensions,
    } = nodeDef;

    const resource = loaderCtx.resource;

    let children: RemoteNode[] | undefined;

    if (childIndices) {
      children = childIndices.map((index) => loadGLTFNode(loaderCtx, index));
    }

    const node = new RemoteNode(resource.manager, {
      name,
    });

    loaderCtx.nodeMap.set(index, node);
    loaderCtx.nodeIndexMap.set(node, index);

    if (matrix) {
      node.localMatrix.set(matrix);
      mat4.getTranslation(node.position, node.localMatrix);
      getRotationNoAlloc(node.quaternion, node.localMatrix);
      mat4.getScaling(node.scale, node.localMatrix);
    } else {
      if (translation) node.position.set(translation);
      if (rotation) node.quaternion.set(rotation);
      if (scale) node.scale.set(scale);
      updateMatrix(node);
    }

    if (children) {
      for (const child of children) {
        addChild(node, child);
      }
    }

    loaderCtx.postLoadCallbacks.push(() => {
      const { mesh, skin, instancedMesh, lightMap, camera, light, audioEmitter, reflectionProbe, collider } = {
        mesh: meshIndex !== undefined ? loadGLTFMesh(resource, meshIndex) : undefined,
        skin: skinIndex !== undefined ? loadGLTFSkin(loaderCtx, skinIndex) : undefined,
        instancedMesh:
          extensions?.EXT_mesh_gpu_instancing !== undefined
            ? loadGLTFInstancedMesh(resource, extensions?.EXT_mesh_gpu_instancing)
            : undefined,
        lightMap:
          extensions?.MX_lightmap !== undefined ? loadGLTFLightMap(resource, extensions.MX_lightmap) : undefined,
        camera: cameraIndex !== undefined ? loadGLTFCamera(resource, cameraIndex) : undefined,
        light:
          extensions?.KHR_lights_punctual?.light !== undefined
            ? loadGLTFLight(resource, extensions.KHR_lights_punctual.light)
            : undefined,
        audioEmitter:
          extensions?.KHR_audio?.emitter !== undefined
            ? loadGLTFAudioEmitter(resource, extensions.KHR_audio.emitter, loaderCtx.audioOutput)
            : undefined,
        reflectionProbe: extensions?.MX_reflection_probes
          ? loadGLTFReflectionProbe(resource, extensions.MX_reflection_probes.reflectionProbe)
          : undefined,
        collider: extensions?.OMI_collider ? loadGLTFCollider(resource, extensions.OMI_collider.collider) : undefined,
      };

      node.mesh = mesh;
      node.skin = skin;
      node.instancedMesh = instancedMesh;
      node.lightMap = lightMap;
      node.camera = camera;
      node.light = light;
      node.audioEmitter = audioEmitter;
      node.reflectionProbe = reflectionProbe;
      node.collider = collider;

      if (extensions?.MX_components) {
        loadGLTFComponents(loaderCtx, extensions.MX_components, node);
      }

      if (extensions?.MOZ_hubs_components) {
        loadGLTFHubsComponents(loaderCtx, extensions.MOZ_hubs_components, node);
      } else if (
        loaderCtx.createDefaultMeshColliders &&
        node.mesh &&
        !(resource.root.extensionsUsed && resource.root.extensionsUsed.includes("OMI_collider"))
      ) {
        addTrimeshFromMesh(loaderCtx, node, node.mesh);
      }

      if (extensions?.MX_spawn_point) {
        loadGLTFSpawnPoint(loaderCtx, node);
      }

      if (extensions?.OMI_physics_body) {
        loadGLTFPhysicsBody(loaderCtx, node, extensions.OMI_physics_body);
      } else if (extensions?.OMI_collider) {
        loadDefaultGLTFPhysicsBody(loaderCtx, node);
      }

      if (extensions?.MX_tiles_renderer) {
        loadGLTFTilesRenderer(loaderCtx, node, extensions.MX_tiles_renderer);
      }

      if (extensions?.OMI_link) {
        loadGLTFLink(loaderCtx, node, extensions.OMI_link);
      }

      if (extensions?.MX_portal) {
        loadGLTFPortal(loaderCtx, node, extensions.MX_portal);
      }

      if (extensions?.MX_static) {
        node.isStatic = loaderCtx.useMXStatic;
      }

      if (extensions?.MX_lights_shadows) {
        const { castShadow, receiveShadow } = extensions.MX_lights_shadows;
        node.castShadow = castShadow;
        node.receiveShadow = receiveShadow;
      } else {
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });

    return node;
  }
);

const loadGLTFBuffer = createCachedSubresourceLoader(
  "buffer",
  (root) => root.buffers,
  (resource, { name, uri }, index) => {
    const data = resource.buffers.get(index);

    if (!data) {
      throw new Error(`Invalid buffer at index ${index}`);
    }

    return new RemoteBuffer(resource.manager, {
      name,
      uri,
      data,
    });
  }
);

const loadGLTFBufferView = createCachedSubresourceLoader(
  "bufferView",
  (root) => root.bufferViews,
  (resource, { name, buffer: bufferIndex, byteOffset, byteStride, byteLength, target }) => {
    const buffer = loadGLTFBuffer(resource, bufferIndex);

    return new RemoteBufferView(resource.manager, {
      name,
      buffer,
      byteOffset,
      byteStride,
      byteLength,
      target,
    });
  }
);

interface ImageOptions {
  flipY?: boolean;
}

const loadGLTFImage = createCachedSubresourceLoader(
  "image",
  (root) => root.images,
  (resource, { name, uri, bufferView: bufferViewIndex, mimeType }, index, options?: ImageOptions) => {
    if (uri) {
      const filePath = resource.fileMap.get(uri) || uri;
      const resolvedUri = resolveURL(filePath, resource.baseUrl);
      return new RemoteImage(resource.manager, {
        name,
        uri: resolvedUri,
        flipY: options?.flipY,
      });
    } else if (bufferViewIndex !== undefined) {
      if (!mimeType) {
        throw new Error(`Image ${index} has a bufferView but no mimeType`);
      }

      const bufferView = loadGLTFBufferView(resource, bufferViewIndex);

      return new RemoteImage(resource.manager, {
        name,
        bufferView,
        mimeType,
        flipY: options?.flipY,
      });
    } else {
      throw new Error(`image[${index}] has no uri or bufferView`);
    }
  }
);

interface SamplerOptions {
  mapping?: SamplerMapping;
}

const loadGLTFSampler = createCachedSubresourceLoader(
  "sampler",
  (root) => root.samplers,
  (resource, { name, magFilter, minFilter, wrapS, wrapT }, index, options?: SamplerOptions) => {
    return new RemoteSampler(resource.manager, {
      name,
      magFilter,
      minFilter,
      wrapS,
      wrapT,
      mapping: options?.mapping,
    });
  }
);

interface TextureOptions {
  encoding?: TextureEncoding;
  mapping?: SamplerMapping;
  flipY?: boolean;
}

const loadGLTFTexture = createCachedSubresourceLoader(
  "texture",
  (root) => root.textures,
  (resource, texture, index, options?: TextureOptions) => {
    const basisSourceIndex = texture.extensions?.KHR_texture_basisu?.source;

    if (texture.source === undefined && basisSourceIndex === undefined) {
      throw new Error(`texture[${index}].source is undefined.`);
    }

    const { source, sampler } = {
      source:
        basisSourceIndex !== undefined
          ? loadGLTFImage(resource, basisSourceIndex)
          : texture.source !== undefined
          ? loadGLTFImage(resource, texture.source, { flipY: options?.flipY })
          : undefined,
      sampler:
        texture.sampler !== undefined
          ? loadGLTFSampler(resource, texture.sampler, { mapping: options?.mapping })
          : undefined,
    };

    if (!source) {
      throw new Error(`No image source found for texture[${index}]`);
    }

    const rgbm = !!texture.extensions?.MX_texture_rgbm;

    return new RemoteTexture(resource.manager, {
      name: texture.name,
      source,
      rgbm,
      encoding: options?.encoding,
      sampler,
      format: basisSourceIndex !== undefined ? TextureFormat.Basis : TextureFormat.Unknown,
      depth: 0, // TODO
    });
  }
);

const GLTFAlphaModes: { [key: string]: MaterialAlphaMode } = {
  OPAQUE: MaterialAlphaMode.OPAQUE,
  MASK: MaterialAlphaMode.MASK,
  BLEND: MaterialAlphaMode.BLEND,
};

const loadGLTFMaterial = createCachedSubresourceLoader(
  "material",
  (root) => root.materials,
  (
    resource,
    {
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
    }
  ) => {
    if (extensions?.KHR_materials_unlit) {
      const { baseColorTexture } = {
        baseColorTexture:
          pbrMetallicRoughness?.baseColorTexture?.index !== undefined
            ? loadGLTFTexture(resource, pbrMetallicRoughness.baseColorTexture.index, {
                encoding: TextureEncoding.sRGB,
              })
            : undefined,
      };

      return new RemoteMaterial(resource.manager, {
        type: MaterialType.Unlit,
        name,
        doubleSided,
        alphaMode: alphaMode ? GLTFAlphaModes[alphaMode] : undefined,
        alphaCutoff,
        baseColorFactor: pbrMetallicRoughness?.baseColorFactor,
        baseColorTexture,
      });
    } else {
      const transmissionTextureInfo = extensions?.KHR_materials_transmission?.transmissionTexture;
      const {
        thicknessFactor,
        thicknessTexture: thicknessTextureInfo,
        attenuationDistance,
        attenuationColor,
      } = extensions?.KHR_materials_volume || {};

      const {
        baseColorTexture,
        metallicRoughnessTexture,
        normalTexture: _normalTexture,
        occlusionTexture: _occlusionTexture,
        emissiveTexture: _emissiveTexture,
        transmissionTexture,
        thicknessTexture,
      } = {
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
      };

      const baseColorTransform = pbrMetallicRoughness?.baseColorTexture?.extensions?.KHR_texture_transform;
      const metallicRoughnessTransform =
        pbrMetallicRoughness?.metallicRoughnessTexture?.extensions?.KHR_texture_transform;
      const normalTransform = normalTexture?.extensions?.KHR_texture_transform;
      const occlusionTransform = occlusionTexture?.extensions?.KHR_texture_transform;
      const emissiveTransform = emissiveTexture?.extensions?.KHR_texture_transform;
      const transmissionTransform = transmissionTextureInfo?.extensions?.KHR_texture_transform;
      const thicknessTransform = thicknessTextureInfo?.extensions?.KHR_texture_transform;

      return new RemoteMaterial(resource.manager, {
        type: MaterialType.Standard,
        name,
        doubleSided,
        alphaMode: alphaMode ? GLTFAlphaModes[alphaMode] : undefined,
        alphaCutoff,
        baseColorFactor: pbrMetallicRoughness?.baseColorFactor,
        baseColorTexture,
        baseColorTextureOffset: baseColorTransform?.offset,
        baseColorTextureRotation: baseColorTransform?.rotation,
        baseColorTextureScale: baseColorTransform?.scale,
        metallicFactor: pbrMetallicRoughness?.metallicFactor,
        roughnessFactor: pbrMetallicRoughness?.roughnessFactor,
        metallicRoughnessTexture,
        metallicRoughnessTextureOffset: metallicRoughnessTransform?.offset,
        metallicRoughnessTextureRotation: metallicRoughnessTransform?.rotation,
        metallicRoughnessTextureScale: metallicRoughnessTransform?.scale,
        normalTexture: _normalTexture,
        normalScale: normalTexture?.scale,
        normalTextureOffset: normalTransform?.offset,
        normalTextureRotation: normalTransform?.rotation,
        normalTextureScale: normalTransform?.scale,
        occlusionTextureStrength: occlusionTexture?.strength,
        occlusionTexture: _occlusionTexture,
        occlusionTextureOffset: occlusionTransform?.offset,
        occlusionTextureRotation: occlusionTransform?.rotation,
        occlusionTextureScale: occlusionTransform?.scale,
        emissiveFactor,
        emissiveStrength: extensions?.KHR_materials_emissive_strength?.emissiveStrength,
        emissiveTexture: _emissiveTexture,
        emissiveTextureOffset: emissiveTransform?.offset,
        emissiveTextureRotation: emissiveTransform?.rotation,
        emissiveTextureScale: emissiveTransform?.scale,
        transmissionTexture,
        transmissionTextureOffset: transmissionTransform?.offset,
        transmissionTextureRotation: transmissionTransform?.rotation,
        transmissionTextureScale: transmissionTransform?.scale,
        thicknessTexture,
        thicknessTextureOffset: thicknessTransform?.offset,
        thicknessTextureRotation: thicknessTransform?.rotation,
        thicknessTextureScale: thicknessTransform?.scale,
        ior: extensions?.KHR_materials_ior?.ior,
        transmissionFactor: extensions?.KHR_materials_transmission?.transmissionFactor,
        thicknessFactor,
        attenuationDistance,
        attenuationColor,
      });
    }
  }
);

const GLTFAccessorTypeToAccessorType: { [key: string]: AccessorType } = {
  SCALAR: AccessorType.SCALAR,
  VEC2: AccessorType.VEC2,
  VEC3: AccessorType.VEC3,
  VEC4: AccessorType.VEC4,
  MAT2: AccessorType.MAT2,
  MAT3: AccessorType.MAT3,
  MAT4: AccessorType.MAT4,
};

const loadGLTFAccessor = createCachedSubresourceLoader(
  "accessor",
  (root) => root.accessors,
  (
    resource,
    { name, bufferView: bufferViewIndex, type, componentType, count, byteOffset, normalized, min, max, sparse }
  ) => {
    const { bufferView } = {
      bufferView: bufferViewIndex !== undefined ? loadGLTFBufferView(resource, bufferViewIndex) : undefined,
    };

    let sparseAccessor: RemoteSparseAccessor | undefined = undefined;

    if (sparse) {
      const { values, indices } = {
        values: loadGLTFBufferView(resource, sparse.values.bufferView),
        indices: loadGLTFBufferView(resource, sparse.indices.bufferView),
      };

      sparseAccessor = new RemoteSparseAccessor(resource.manager, {
        count: sparse.count,
        indicesByteOffset: sparse.indices.byteOffset,
        indicesComponentType: sparse.indices.componentType,
        indicesBufferView: indices,
        valuesByteOffset: sparse.values.byteOffset,
        valuesBufferView: values,
      });
    }

    return new RemoteAccessor(resource.manager, {
      name,
      bufferView,
      type: GLTFAccessorTypeToAccessorType[type],
      componentType,
      count,
      byteOffset,
      normalized,
      min,
      max,
      sparse: sparseAccessor,
    });
  }
);

const MeshPrimitiveAttributesToIndices: { [key: string]: MeshPrimitiveAttributeIndex } = {
  POSITION: MeshPrimitiveAttributeIndex.POSITION,
  NORMAL: MeshPrimitiveAttributeIndex.NORMAL,
  TANGENT: MeshPrimitiveAttributeIndex.TANGENT,
  TEXCOORD_0: MeshPrimitiveAttributeIndex.TEXCOORD_0,
  TEXCOORD_1: MeshPrimitiveAttributeIndex.TEXCOORD_1,
  COLOR_0: MeshPrimitiveAttributeIndex.COLOR_0,
  JOINTS_0: MeshPrimitiveAttributeIndex.JOINTS_0,
  WEIGHTS_0: MeshPrimitiveAttributeIndex.WEIGHTS_0,
};

const InstancedMeshAttributeToIndices: { [key: string]: InstancedMeshAttributeIndex } = {
  TRANSLATION: InstancedMeshAttributeIndex.TRANSLATION,
  ROTATION: InstancedMeshAttributeIndex.ROTATION,
  SCALE: InstancedMeshAttributeIndex.SCALE,
  _LIGHTMAP_OFFSET: InstancedMeshAttributeIndex.LIGHTMAP_OFFSET,
  _LIGHTMAP_SCALE: InstancedMeshAttributeIndex.LIGHTMAP_SCALE,
};

function loadGLTFMeshPrimitive(resource: GLTFResource, primitive: GLTFMeshPrimitive): RemoteMeshPrimitive {
  const attributes: { [key: string]: RemoteAccessor } = {};

  for (const key in primitive.attributes) {
    const index = MeshPrimitiveAttributesToIndices[key];
    attributes[index] = loadGLTFAccessor(resource, primitive.attributes[key]);
  }

  const { indices, material } = {
    indices: primitive.indices !== undefined ? loadGLTFAccessor(resource, primitive.indices) : undefined,
    material: primitive.material !== undefined ? loadGLTFMaterial(resource, primitive.material) : undefined,
  };

  return new RemoteMeshPrimitive(resource.manager, {
    indices,
    attributes,
    material,
    mode: primitive.mode,
  });
}

const loadGLTFMesh = createCachedSubresourceLoader(
  "mesh",
  (root) => root.meshes,
  (resource, { name, primitives: primitiveDefs }) => {
    const primitives = primitiveDefs.map((primitive) => loadGLTFMeshPrimitive(resource, primitive));

    return new RemoteMesh(resource.manager, {
      name,
      primitives,
    });
  }
);

const loadGLTFSkin = createInstancedSubresourceLoader(
  "skin",
  (root) => root.skins,
  (
    loaderCtx,
    { name, inverseBindMatrices: inverseBindMatricesIndex, skeleton: skeletonIndex, joints: jointIndices },
    index
  ) => {
    const inverseBindMatrices = inverseBindMatricesIndex
      ? loadGLTFAccessor(loaderCtx.resource, inverseBindMatricesIndex)
      : undefined;

    const joints = jointIndices.map((index) => {
      const joint = loaderCtx.nodeMap.get(index);

      if (!joint) {
        throw new Error(`Node ${index} not found`);
      }

      return joint;
    });

    return new RemoteSkin(loaderCtx.resource.manager, {
      name,
      joints,
      inverseBindMatrices,
    });
  }
);

const loadGLTFCamera = createCachedSubresourceLoader(
  "camera",
  (root) => root.cameras,
  (resource, camera) => {
    if (camera.perspective) {
      return new RemoteCamera(resource.manager, {
        name: camera.name,
        type: CameraType.Perspective,
        aspectRatio: camera.perspective.aspectRatio,
        yfov: camera.perspective.yfov,
        zfar: camera.perspective.zfar,
        znear: camera.perspective.znear,
      });
    } else if (camera.orthographic) {
      return new RemoteCamera(resource.manager, {
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
  }
);

const GLTFLightTypeToLightType: { [key: string]: LightType } = {
  directional: LightType.Directional,
  point: LightType.Point,
  spot: LightType.Spot,
};

const loadGLTFLight = createCachedSubresourceLoader(
  "light",
  (root) => root.extensions?.KHR_lights_punctual?.lights,
  (resource, { name, type, color, intensity, range, spot }) => {
    return new RemoteLight(resource.manager, {
      name,
      type: GLTFLightTypeToLightType[type],
      color,
      intensity,
      range,
      innerConeAngle: spot?.innerConeAngle,
      outerConeAngle: spot?.outerConeAngle,
    });
  }
);

const loadGLTFReflectionProbe = createCachedSubresourceLoader(
  "reflection-probe",
  (root) => root.extensions?.MX_reflection_probes?.reflectionProbes,
  (resource, { reflectionProbeTexture, size }) => {
    return new RemoteReflectionProbe(resource.manager, {
      reflectionProbeTexture: loadGLTFTexture(resource, reflectionProbeTexture.index, {
        mapping: SamplerMapping.EquirectangularReflectionMapping,
        flipY: true,
      }),
      size,
    });
  }
);

const loadGLTFAudioData = createCachedSubresourceLoader(
  "audio",
  (root) => root.extensions?.KHR_audio?.audio,
  (resource, { name, uri, bufferView, mimeType }, index) => {
    if (uri) {
      return new RemoteAudioData(resource.manager, {
        name,
        uri: resolveGLTFURI(resource, uri),
      });
    } else if (bufferView !== undefined) {
      if (!mimeType) {
        throw new Error(`audio[${index}] has a bufferView but no mimeType`);
      }

      return new RemoteAudioData(resource.manager, {
        name,
        bufferView: loadGLTFBufferView(resource, bufferView),
        mimeType,
      });
    } else {
      throw new Error(`audio[${index}] has no uri or bufferView`);
    }
  }
);

const loadGLTFAudioSource = createCachedSubresourceLoader(
  "audio-source",
  (root) => root.extensions?.KHR_audio?.sources,
  (resource, { name, gain, loop, autoPlay, audio: audioDataIndex }) => {
    return new RemoteAudioSource(resource.manager, {
      name,
      gain,
      loop,
      autoPlay,
      audio: audioDataIndex !== undefined ? loadGLTFAudioData(resource, audioDataIndex) : undefined,
    });
  }
);

const GLTFAudioEmitterDistanceModel: { [key: string]: AudioEmitterDistanceModel } = {
  linear: AudioEmitterDistanceModel.Linear,
  inverse: AudioEmitterDistanceModel.Inverse,
  exponential: AudioEmitterDistanceModel.Exponential,
};

const loadGLTFAudioEmitter = createCachedSubresourceLoader(
  "audio-emitter",
  (root) => root.extensions?.KHR_audio?.emitters,
  (resource, props, index, output?: AudioEmitterOutput) => {
    const { name, gain, type, sources: audioSourceIndices } = props;
    const sources = audioSourceIndices ? audioSourceIndices.map((index) => loadGLTFAudioSource(resource, index)) : [];

    if (type === "global") {
      return new RemoteAudioEmitter(resource.manager, {
        type: AudioEmitterType.Global,
        name,
        gain,
        sources,
        output,
      });
    } else if (type === "positional") {
      // An older spec of KHR_audio was specified with the positional props on the AudioEmitter object
      const { coneInnerAngle, coneOuterAngle, coneOuterGain, distanceModel, maxDistance, refDistance, rolloffFactor } =
        props.positional || (props as GLTFAudioEmitterPositional);

      return new RemoteAudioEmitter(resource.manager, {
        type: AudioEmitterType.Positional,
        name,
        coneInnerAngle,
        coneOuterAngle,
        coneOuterGain,
        distanceModel: distanceModel ? GLTFAudioEmitterDistanceModel[distanceModel] : undefined,
        maxDistance,
        refDistance,
        rolloffFactor,
        gain,
        sources,
        output,
      });
    } else {
      throw new Error(`Unknown audio emitter type ${type}`);
    }
  }
);

const GLTFAnimationInterpolationToAnimationInterpolation: { [key: string]: AnimationSamplerInterpolation } = {
  LINEAR: AnimationSamplerInterpolation.LINEAR,
  STEP: AnimationSamplerInterpolation.STEP,
  CUBICSPLINE: AnimationSamplerInterpolation.CUBICSPLINE,
};

function loadGLTFAnimationSampler(
  resource: GLTFResource,
  { input: inputIndex, output: outputIndex, interpolation }: GLTFAnimationSampler
) {
  const { input, output } = {
    input: loadGLTFAccessor(resource, inputIndex),
    output: loadGLTFAccessor(resource, outputIndex),
  };

  return new RemoteAnimationSampler(resource.manager, {
    input,
    output,
    interpolation: interpolation ? GLTFAnimationInterpolationToAnimationInterpolation[interpolation] : undefined,
  });
}

const GLTFAnimationTargetPathToAnimationTargetPath: { [key: string]: AnimationChannelTargetPath } = {
  translation: AnimationChannelTargetPath.Translation,
  rotation: AnimationChannelTargetPath.Rotation,
  scale: AnimationChannelTargetPath.Scale,
  weights: AnimationChannelTargetPath.Weights,
};

function loadGLTFAnimationChannel(
  loaderCtx: GLTFLoaderContext,
  samplerDefs: GLTFAnimationSampler[],
  { sampler: samplerIndex, target }: GLTFAnimationChannel
) {
  const sampler = loadGLTFAnimationSampler(loaderCtx.resource, samplerDefs[samplerIndex]);

  let targetNode: RemoteNode | undefined = undefined;

  if (!target.node) {
    throw new Error("Animation target node is undefined");
  }

  targetNode = loaderCtx.nodeMap.get(target.node);

  if (!targetNode) {
    throw new Error("Animation target node not found");
  }

  return new RemoteAnimationChannel(loaderCtx.resource.manager, {
    sampler,
    targetNode,
    targetPath: GLTFAnimationTargetPathToAnimationTargetPath[target.path],
  });
}

const loadGLTFAnimation = createInstancedSubresourceLoader(
  "animation",
  (root) => root.animations,
  (loaderCtx, { name, channels: channelDefs, samplers: samplerDefs }, index) => {
    const channels = channelDefs.map((def) => loadGLTFAnimationChannel(loaderCtx, samplerDefs, def));
    const samplers = samplerDefs.map((def) => loadGLTFAnimationSampler(loaderCtx.resource, def));

    const animation = new RemoteAnimation(loaderCtx.resource.manager, {
      name,
      channels,
      samplers,
    });

    animation.clip = loadGLTFAnimationClip(loaderCtx, animation);

    return animation;
  }
);
