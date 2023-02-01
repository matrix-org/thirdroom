import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { ResourceModule } from "./resource.game";
import { RemoteResource } from "./ResourceDefinition";

interface ResourceRef {
  resource: RemoteResource<GameState>;
  resourceName: string;
  propName: string;
  index: number;
}

export function findResourceRetainers(ctx: GameState, resourceId: number) {
  const resourceModule = getModule(ctx, ResourceModule);

  const resourceInfo = resourceModule.resourceInfos.get(resourceId);

  if (!resourceInfo) {
    return {
      refs: [],
      refCount: 0,
    };
  }

  const { resource, refCount } = resourceInfo;

  const refs: ResourceRef[] = [];

  for (const [resourceType, resourceDef] of resourceModule.resourceDefByType) {
    const refProps: { propName: string; size: number }[] = [];

    const schema = resourceDef.schema;

    for (const propName in schema) {
      const prop = schema[propName];

      if (typeof resource === "string") {
        if (prop.type === "string") {
          refProps.push({
            propName,
            size: 1,
          });
        }
      } else if (resource instanceof ArrayBuffer) {
        if (prop.type === "arrayBuffer") {
          refProps.push({
            propName,
            size: prop.size,
          });
        }
      } else {
        if (prop.resourceDef && !prop.backRef && prop.resourceDef === resource.resourceDef) {
          refProps.push({
            propName,
            size: prop.size,
          });
        }
      }
    }

    const resources = resourceModule.resourcesByType.get(resourceType);

    if (resources) {
      for (const resource of resources) {
        for (const { propName, size } of refProps) {
          for (let index = 0; index < size; index++) {
            if (resource.__props[propName][index] === resourceId) {
              refs.push({
                resource,
                resourceName: resource.resourceDef.name,
                propName,
                index,
              });
            }
          }
        }
      }
    }
  }

  return {
    refs,
    refCount,
  };
}

export function findResourceRetainerRoots(ctx: GameState, resourceId: number) {
  const { refs } = findResourceRetainers(ctx, resourceId);

  const results: ResourceRef[] = [];

  for (const ref of refs) {
    findResourceRetainerRootsRecursive(ctx, ref, results);
  }

  return results;
}

function findResourceRetainerRootsRecursive(ctx: GameState, ref: ResourceRef, results: ResourceRef[]) {
  const { refs: childRefs } = findResourceRetainers(ctx, ref.resource.eid);

  if (childRefs.length === 0) {
    results.push(ref);
  } else {
    for (const childRef of childRefs) {
      findResourceRetainerRootsRecursive(ctx, childRef, results);
    }
  }
}
