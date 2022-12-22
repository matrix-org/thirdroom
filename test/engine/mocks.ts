import RAPIER from "@dimforge/rapier3d-compat";
import { addEntity, createWorld } from "bitecs";

import { PostMessageTarget } from "../../src/engine/WorkerMessage";
import { PrefabModule, registerPrefab } from "../../src/engine/prefab/prefab.game";
import { GameState } from "../../src/engine/GameTypes";
import { NetworkModule } from "../../src/engine/network/network.game";
import { RendererModule } from "../../src/engine/renderer/renderer.game";
import { PhysicsModule } from "../../src/engine/physics/physics.game";
import { ResourceModule } from "../../src/engine/resource/resource.game";
import { createTripleBuffer } from "../../src/engine/allocator/TripleBuffer";
import {
  IRemoteResourceManager,
  RemoteResource,
  ResourceDefinition,
  ResourceData,
} from "../../src/engine/resource/ResourceDefinition";

export function registerDefaultPrefabs(state: GameState) {
  registerPrefab(state, {
    name: "test-prefab",
    create: () => addEntity(state.world),
  });
}

export const mockPostMessageTarget = () =>
  ({
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
  } as PostMessageTarget);

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

export const mockResourceManager = () => ({
  createResource: () => ({}),
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
    resourceManager: mockResourceManager(),
  } as unknown as GameState;

  ctx.modules.set(PhysicsModule, mockPhysicsState());
  ctx.modules.set(NetworkModule, mockNetworkState());
  ctx.modules.set(RendererModule, mockRenderState());
  ctx.modules.set(ResourceModule, mockResourceModule());
  ctx.modules.set(PrefabModule, mockPrefabState());

  registerDefaultPrefabs(ctx);

  return ctx;
};

export class MockResourceManager implements IRemoteResourceManager {
  resources: RemoteResource<ResourceDefinition>[] = [];
  private nextResourceId = 1;
  private resourcesById: Map<number, RemoteResource<ResourceDefinition> | string | SharedArrayBuffer> = new Map();
  private resourceRefs: Map<number, number> = new Map();

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

  createResource(resourceDef: ResourceDefinition): ResourceData {
    const buffer = new SharedArrayBuffer(resourceDef.byteLength);
    const tripleBuffer = createTripleBuffer(new Uint8Array([0x6]), resourceDef.byteLength);
    const resourceId = this.nextResourceId++;

    return {
      resourceId,
      ptr: 0,
      buffer,
      tripleBuffer,
    };
  }

  addResourceInstance(resource: RemoteResource<ResourceDefinition>): void {
    this.resources.push(resource);
    this.resourcesById.set(resource.resourceId, resource);
    this.resourceRefs.set(resource.resourceId, 0);
  }

  getResource<Def extends ResourceDefinition>(resourceDef: Def, resourceId: number): RemoteResource<Def> | undefined {
    return this.resourcesById.get(resourceId) as RemoteResource<Def> | undefined;
  }

  disposeResource(resourceId: number): void {
    const resource = this.resourcesById.get(resourceId);

    if (typeof resource === "string" || resource instanceof SharedArrayBuffer) {
      this.resourcesById.delete(resourceId);
      this.resourceRefs.delete(resourceId);
      return;
    }

    if (!resource) {
      return;
    }

    const index = this.resources.indexOf(resource);
    this.resources.splice(index, 1);

    const schema = resource.constructor.resourceDef.schema;

    for (const propName in schema) {
      const prop = schema[propName];

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
  }

  getRef<Def extends ResourceDefinition>(resourceDef: Def, store: Uint32Array): RemoteResource<Def> | undefined {
    return this.resourcesById.get(store[0]) as RemoteResource<Def> | undefined;
  }

  setRef(value: RemoteResource<ResourceDefinition>, store: Uint32Array, backRef?: boolean): void {
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

  setRefArrayItem(index: number, value: RemoteResource<ResourceDefinition> | undefined, store: Uint32Array): void {
    if (value) {
      this.addRef(value.resourceId);
      store[index] = value.resourceId;
    } else {
      store[index] = 0;
    }
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
