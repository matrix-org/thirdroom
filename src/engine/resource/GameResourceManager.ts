import { createTripleBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { Thread } from "../module/module.common";
import { defineRemoteResourceClass, IRemoteResourceClass } from "./RemoteResourceClass";
import { ResourceId } from "./resource.common";
import { createResource, getRemoteResource, setRemoteResource } from "./resource.game";
import { InitialResourceProps, IRemoteResourceManager, RemoteResource, ResourceDefinition } from "./ResourceDefinition";

export class GameResourceManager implements IRemoteResourceManager {
  private resourceConstructors: Map<ResourceDefinition, IRemoteResourceClass<ResourceDefinition>> = new Map();
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
    const resourceId = createResource(this.ctx, Thread.Shared, resourceDef.name, tripleBuffer);
    const resource = new resourceConstructor(this, resourceId, buffer, 0, tripleBuffer, props);
    setRemoteResource(this.ctx, resourceId, resource);
    this.resources.push(resource as RemoteResource<ResourceDefinition>);

    return resource;
  }

  getResource<Def extends ResourceDefinition>(
    resourceDef: Def,
    resourceId: ResourceId
  ): RemoteResource<Def> | undefined {
    return getRemoteResource<RemoteResource<Def>>(this.ctx, resourceId);
  }
}
