import RAPIER from "@dimforge/rapier3d-compat";
import { addEntity, createWorld } from "bitecs";

import { PrefabModule, registerPrefab } from "../../src/engine/prefab/prefab.game";
import { GameState } from "../../src/engine/GameTypes";
import { NetworkModule } from "../../src/engine/network/network.game";
import { RendererModule } from "../../src/engine/renderer/renderer.game";
import { PhysicsModule } from "../../src/engine/physics/physics.game";
import { RemoteNode, RemoteScene, ResourceModule } from "../../src/engine/resource/resource.game";
import { createTripleBuffer } from "../../src/engine/allocator/TripleBuffer";
import {
  IRemoteResourceManager,
  RemoteResource,
  ResourceDefinition,
  ResourceData,
} from "../../src/engine/resource/ResourceDefinition";
import { addRemoteNodeComponent } from "../../src/engine/node/node.game";
import { addChild } from "../../src/engine/component/transform";
import { GLTFCacheEntry, GLTFResource } from "../../src/engine/gltf/gltf.game";

export function registerDefaultPrefabs(state: GameState) {
  registerPrefab(state, {
    name: "test-prefab",
    create: () => {
      const eid = addEntity(state.world);
      return addRemoteNodeComponent(state, eid);
    },
  });
}

export const mockPostMessageTarget = () => ({
  postMessage: (message: any, transfer?: Array<Transferable | OffscreenCanvas>) => {},
  addEventListener: (
    type: string,
    callback: ((message: any) => void) | null,
    options?: AddEventListenerOptions | boolean
  ) => {},
  removeEventListener: (
    type: string,
    callback: ((message: any) => void) | null,
    options?: EventListenerOptions | boolean
  ) => {},
});

export const mockPhysicsState = () => ({
  physicsWorld: {
    createRigidBody: (body: RAPIER.RigidBodyDesc) => ({
      handle: 0,
      lockTranslations: () => {},
      lockRotations: () => {},
      numColliders: () => 1,
      collider: () => 1,
    }),
    createCollider: (desc: RAPIER.ColliderDesc, parentHandle?: number | undefined) => {},
    getCollider: () => ({
      collisionGroups: () => 0,
      setActiveEvents: () => {},
      setCollisionGroups: () => {},
    }),
  } as unknown as RAPIER.World,
});

export const mockRenderState = () => ({
  scenes: [],
  textures: [],
  unlitMaterials: [],
  standardMaterials: [],
  directionalLights: [],
  pointLights: [],
  spotLights: [],
  perspectiveCameras: [],
  orthographicCameras: [],
  meshPrimitives: [],
});

export const mockNetworkState = () => ({
  networkIdToEntityId: new Map(),
});

export const mockResourceModule = () => ({
  resourceIdMap: new Map(),
  resources: new Map(),
  resourceInfos: new Map(),
  deferredResources: new Map(),
  renderThreadMessageQueue: [],
  renderThreadTransferList: [],
  mainThreadMessageQueue: [],
});

export const mockPrefabState = () => ({
  prefabTemplateMap: new Map(),
});

export const mockGameState = () => {
  const ctx = {
    world: createWorld(),
    renderer: mockRenderState(),
    renderPort: mockPostMessageTarget(),
    systemGraphChanged: true,
    systemGraph: [],
    systems: [],
    messageHandlers: new Map(),
    scopes: new Map(),
    modules: new Map(),
    resourceManager: new MockResourceManager(),
  } as unknown as GameState;

  ctx.activeScene = new RemoteScene(ctx.resourceManager);
  ctx.activeCamera = new RemoteNode(ctx.resourceManager);

  addChild(ctx.activeScene, ctx.activeCamera);

  ctx.modules.set(PhysicsModule, mockPhysicsState());
  ctx.modules.set(NetworkModule, mockNetworkState());
  ctx.modules.set(RendererModule, mockRenderState());
  ctx.modules.set(ResourceModule, mockResourceModule());
  ctx.modules.set(PrefabModule, mockPrefabState());

  registerDefaultPrefabs(ctx);

  return ctx;
};

export class MockResourceManager implements IRemoteResourceManager {
  private resources: RemoteResource[] = [];
  private nextResourceId = 1;
  private resourcesById: Map<number, RemoteResource | string | SharedArrayBuffer> = new Map();
  private resourceRefs: Map<number, number> = new Map();
  private gltfCache: Map<string, GLTFCacheEntry> = new Map();

  getCachedGLTF(uri: string): Promise<GLTFResource> | undefined {
    const entry = this.gltfCache.get(uri);

    if (!entry) {
      return undefined;
    }

    entry.refCount++;

    return entry.promise;
  }

  cacheGLTF(uri: string, promise: Promise<GLTFResource>): void {
    this.gltfCache.set(uri, {
      promise,
      refCount: 1,
    });
  }

  removeGLTFRef(uri: string): boolean {
    const entry = this.gltfCache.get(uri);

    if (entry && --entry.refCount <= 0) {
      entry.promise.then((resource) => {
        // TODO: Dispose GLTF contents

        URL.revokeObjectURL(resource.url);

        for (const objectUrl of resource.fileMap.values()) {
          URL.revokeObjectURL(objectUrl);
        }
      });

      this.gltfCache.delete(uri);

      return true;
    }

    return false;
  }

  getString(store: Uint32Array): string {
    return (this.resourcesById.get(store[0]) as string) || "";
  }

  setString(value: string | undefined, store: Uint32Array): void {
    if (store[0]) {
      this.removeRef(store[0]);
    }

    if (value) {
      const resourceId = this.nextResourceId++;
      this.resourcesById.set(resourceId, value);
      this.resourceRefs.set(resourceId, 0);
      this.addRef(resourceId);
      store[0] = resourceId;
    } else {
      store[0] = 0;
    }
  }

  getArrayBuffer(store: Uint32Array): SharedArrayBuffer {
    return this.resourcesById.get(store[1]) as SharedArrayBuffer;
  }

  setArrayBuffer(value: SharedArrayBuffer, store: Uint32Array): void {
    if (store[1]) {
      throw new Error("You cannot mutate an existing arrayBuffer field.");
    }

    const resourceId = this.nextResourceId++;
    this.resourcesById.set(resourceId, value);
    this.resourceRefs.set(resourceId, 0);
    this.addRef(resourceId);
    store[0] = value.byteLength;
    store[1] = resourceId;
  }

  allocateResource(resourceDef: ResourceDefinition): ResourceData {
    const buffer = new SharedArrayBuffer(resourceDef.byteLength);
    const tripleBuffer = createTripleBuffer(new Uint8Array([0x6]), resourceDef.byteLength);

    return {
      ptr: 0,
      buffer,
      tripleBuffer,
    };
  }

  createResource(resource: RemoteResource): number {
    const resourceId = this.nextResourceId++;
    this.resources.push(resource);
    this.resourcesById.set(resourceId, resource);
    this.resourceRefs.set(resourceId, 0);
    return resourceId;
  }

  getResource<Def extends ResourceDefinition>(resourceDef: Def, resourceId: number): RemoteResource | undefined {
    return this.resourcesById.get(resourceId) as RemoteResource | undefined;
  }

  disposeResource(resourceId: number): boolean {
    const index = this.resources.findIndex((resource) => resource.resourceId === resourceId);

    if (index === -1) {
      return false;
    }

    const resource = this.resources[index];

    const schema = resource.constructor.resourceDef.schema;

    for (const propName in schema) {
      const prop = schema[propName];

      if (prop.backRef) {
        continue;
      }

      if (prop.type === "ref" || prop.type === "string" || prop.type === "refArray" || prop.type === "refMap") {
        const resourceIds = resource.__props[propName];

        for (let i = 0; i < resourceIds.length; i++) {
          const resourceId = resourceIds[i];

          if (resourceId) {
            this.removeRef(resourceId);
          }
        }
      } else if (prop.type === "arrayBuffer") {
        const resourceId = resource.__props[propName][1];

        if (resourceId) {
          this.removeRef(resourceId);
        }
      }
    }

    return true;
  }

  getRef<T extends RemoteResource>(store: Uint32Array): T | undefined {
    return this.resourcesById.get(store[0]) as T | undefined;
  }

  setRef(value: RemoteResource, store: Uint32Array, backRef?: boolean): void {
    if (store[0] && !backRef) {
      this.removeRef(store[0]);
    }

    if (value) {
      store[0] = value.resourceId;

      if (!backRef) {
        this.addRef(store[0]);
      }
    } else {
      store[0] = 0;
    }
  }

  setRefArrayItem(index: number, value: RemoteResource | undefined, store: Uint32Array): void {
    if (value) {
      this.addRef(value.resourceId);
      store[index] = value.resourceId;
    } else {
      store[index] = 0;
    }
  }

  getRefArrayItem<T extends RemoteResource>(index: number, store: Uint32Array): T | undefined {
    const resourceId = store[index];
    return resourceId ? (this.resourcesById.get(resourceId) as T | undefined) : undefined;
  }

  addRef(resourceId: number): void {
    this.resourceRefs.set(resourceId, (this.resourceRefs.get(resourceId) || 0) + 1);
  }

  removeRef(resourceId: number): void {
    const refCount = this.resourceRefs.get(resourceId) || 0;

    if (refCount <= 1) {
      this.disposeResource(resourceId);
    } else {
      this.resourceRefs.set(resourceId, refCount - 1);
    }
  }
}
