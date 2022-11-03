import { copyToWriteBuffer, createTripleBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { defineRemoteResourceClass, IRemoteResourceClass } from "./RemoteResourceClass";
import { ResourceId } from "./resource.common";
import { addResourceRef, createResource, disposeResource, getRemoteResource, setRemoteResource } from "./resource.game";
import {
  InitialResourceProps,
  IRemoteResourceManager,
  RemoteResource,
  RemoteResourceStringStore,
  ResourceDefinition,
} from "./ResourceDefinition";

export class GameResourceManager implements IRemoteResourceManager {
  private resourceConstructors = new Map<ResourceDefinition, IRemoteResourceClass<ResourceDefinition>>();
  public resources: RemoteResource<ResourceDefinition>[] = [];

  constructor(private ctx: GameState) {}

  createResource<Def extends ResourceDefinition>(
    resourceDef: Def,
    props: InitialResourceProps<Def>
  ): RemoteResource<Def> {
    let resourceConstructor = this.resourceConstructors.get(resourceDef) as IRemoteResourceClass<Def> | undefined;

    if (!resourceConstructor) {
      resourceConstructor = defineRemoteResourceClass<Def>(resourceDef);
      this.resourceConstructors.set(
        resourceDef,
        resourceConstructor as unknown as IRemoteResourceClass<ResourceDefinition>
      );
    }

    const buffer = new ArrayBuffer(resourceDef.byteLength);
    const tripleBuffer = createTripleBuffer(this.ctx.gameToRenderTripleBufferFlags, resourceDef.byteLength);
    const resourceId = createResource(this.ctx, Thread.Shared, resourceDef.name, tripleBuffer, {
      dispose: () => {
        const index = this.resources.findIndex((resource) => resource.resourceId === resourceId);

        if (index !== -1) {
          this.resources.splice(index, 1);
        }
      },
    });
    const resource = new resourceConstructor(this, resourceId, buffer, 0, tripleBuffer, props);
    setRemoteResource(this.ctx, resourceId, resource);
    this.resources.push(resource as unknown as RemoteResource<ResourceDefinition>);

    return resource;
  }

  getResource<Def extends ResourceDefinition>(
    resourceDef: Def,
    resourceId: ResourceId
  ): RemoteResource<Def> | undefined {
    return getRemoteResource<RemoteResource<Def>>(this.ctx, resourceId);
  }

  getString(store: RemoteResourceStringStore): string {
    return store.value;
  }

  setString(value: string, store: RemoteResourceStringStore): void {
    store.value = value;
  }

  addRef(resourceId: number) {
    addResourceRef(this.ctx, resourceId);
  }

  removeRef(resourceId: number) {
    disposeResource(this.ctx, resourceId);
  }

  commitResources() {
    const resources = this.resources;

    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      const byteView = resource.byteView;

      if (resource.initialized) {
        copyToWriteBuffer(resource.tripleBuffer, byteView);
      } else {
        const tripleBufferByteViews = resource.tripleBuffer.byteViews;
        tripleBufferByteViews[0].set(byteView);
        tripleBufferByteViews[1].set(byteView);
        tripleBufferByteViews[2].set(byteView);
        resource.initialized = true;
      }
    }
  }
}
