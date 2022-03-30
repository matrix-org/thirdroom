import { Mesh } from 'three';

import { RemoteResourceManager, loadRemoteResource, RemoteResourceLoader } from './RemoteResourceManager';
import { ResourceDefinition, ResourceLoader, ResourceManager } from './ResourceManager';

export interface MeshDefinition extends ResourceDefinition {
  type: 'mesh';
  geometryResourceId: number;
  materialResourceId: number;
}

export function MeshResourceLoader(manager: ResourceManager): ResourceLoader<MeshDefinition, Mesh> {
    return {
        type: 'mesh',
        async load({ name, geometryResourceId, materialResourceId }) {
            const geometryResourceInfo = manager.store.get(geometryResourceId)!;
            const materialResourceInfo = manager.store.get(materialResourceId)!;

            await Promise.all([geometryResourceInfo.promise, materialResourceInfo.promise]);

            const mesh = new Mesh(geometryResourceInfo.resource, materialResourceInfo.resource);

            mesh.name = name!;

            return {
                name,
                resource: mesh,
            };
        },
    };
}

export function MeshRemoteResourceLoader(manager: RemoteResourceManager): RemoteResourceLoader {
    return {
        type: 'mesh',
    };
}

export function createRemoteMesh(
    manager: RemoteResourceManager,
    meshDef: MeshDefinition,
): number {
    return loadRemoteResource(manager, meshDef);
}
