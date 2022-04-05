import { addEntity } from "bitecs";
import { Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import { RemoteResourceManager, loadRemoteResource, RemoteResourceLoader } from "./RemoteResourceManager";
import { addResource, ResourceDefinition, ResourceLoader, ResourceManager } from "./ResourceManager";
import {
  addChild,
  addRenderableComponent,
  addTransformComponent,
  setQuaternionFromEuler,
  Transform,
  updateMatrix,
} from "../component/transform";
import { GameState } from "../GameWorker";

interface GLTFDef extends ResourceDefinition {
  type: "gltf";
  url: string;
}

const renderableObject3DTypes: string[] = [
  "Mesh",
  // "SkinnedMesh",
  // "Points",
  // "LineSegments",
  // "LineLoop",
  // "Line",
  // "Bone",
  "PerspectiveCamera",
  "OrthographicCamera",
  "DirectionalLight",
  "PointLight",
  "SpotLight",
];

const object3DTypeToResourceType: { [type: string]: string } = {
  PerspectiveCamera: "camera",
  OrthographicCamera: "camera",
  DirectionalLight: "light",
  PointLight: "light",
  SpotLight: "light",
};

interface ComponentDescription {
  type: string;
  [key: string]: any;
}

interface EntityDescription {
  components: ComponentDescription[];
  children?: EntityDescription[];
}

interface RemoteGLTF {
  root: EntityDescription;
}

function traverse(object: Object3D, manager: ResourceManager): EntityDescription {
  const components: ComponentDescription[] = [];

  components.push({
    type: "transform",
    position: object.position.toArray(),
    rotation: object.rotation.toArray().slice(0, 3),
    scale: object.scale.toArray(),
  });

  if (renderableObject3DTypes.includes(object.type)) {
    const resourceType = object3DTypeToResourceType[object.type];
    const resourceId = addResource(manager, resourceType, object, object.name);

    components.push({
      type: "renderable",
      resourceId,
    });
  }

  return {
    components,
    children: object.children.map((child) => traverse(child, manager)),
  };
}

export function GLTFResourceLoader(manager: ResourceManager): ResourceLoader<GLTFDef, Object3D, RemoteGLTF> {
  const gltfLoader = new GLTFLoader();

  return {
    type: "gltf",
    async load({ name, url }) {
      const { scene } = await gltfLoader.loadAsync(url);

      return {
        name,
        resource: scene,
        remoteResource: {
          root: traverse(scene, manager),
        },
      };
    },
  };
}

function inflate(state: GameState, entity: EntityDescription, parentEid?: number) {
  const { world } = state;
  const eid = addEntity(world);

  for (const component of entity.components) {
    switch (component.type) {
      case "transform":
        addTransformComponent(world, eid);
        Transform.position[eid].set(component.position);
        Transform.rotation[eid].set(component.rotation);
        Transform.scale[eid].set(component.scale);
        setQuaternionFromEuler(Transform.quaternion[eid], Transform.rotation[eid]);
        updateMatrix(eid);

        if (parentEid !== undefined) {
          addChild(parentEid, eid);
        }
        break;
      case "renderable":
        addRenderableComponent(state, eid, component.resourceId);
        break;
    }
  }

  if (entity.children) {
    for (const child of entity.children) {
      inflate(state, child, eid);
    }
  }

  return eid;
}

export function GLTFRemoteResourceLoader(state: GameState): RemoteResourceLoader<RemoteGLTF> {
  return {
    type: "gltf",
    loaded(resourceId: number, remoteResource: RemoteGLTF) {
      const gltfSceneEid = inflate(state, remoteResource.root);
      // TODO: this needs to be placed on the entity which loaded this object, and the glTF resource should be reusable
      addChild(state.scene, gltfSceneEid);
    },
  };
}

export function loadRemoteGLTF(manager: RemoteResourceManager, gltfDef: GLTFDef): number {
  return loadRemoteResource(manager, gltfDef);
}
