import { Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import { GLTFComponentDescription, GLTFEntityDescription, RemoteGLTF } from ".";
import { addResource, ResourceDefinition, ResourceLoader, ResourceManager } from "../resources/ResourceManager";

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

function serializeGLTF(object: Object3D, manager: ResourceManager): GLTFEntityDescription {
  const components: GLTFComponentDescription[] = [];

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
    children: object.children.map((child) => serializeGLTF(child, manager)),
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
          scene: serializeGLTF(scene, manager),
        },
      };
    },
  };
}
