import { Camera, Mesh, Object3D } from "three";
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

function serializeGLTF(
  object: Object3D,
  manager: ResourceManager,
  transferList: Transferable[]
): GLTFEntityDescription {
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

  if (object.userData["spawn-point"]) {
    components.push({
      type: "spawn-point",
    });
  }

  if (object.userData["directional-light"]) {
    components.push({
      type: "directional-light",
    });
  }

  if (object.type === "Mesh") {
    object.castShadow = true;
    object.receiveShadow = true;

    const mesh = object as Mesh;

    const indices = mesh.geometry.getIndex()!.clone().array as Uint32Array;
    const vertices = mesh.geometry.getAttribute("position").clone().applyMatrix4(mesh.matrixWorld)
      .array as Float32Array;

    components.push({
      type: "trimesh",
      vertices,
      indices,
    });

    transferList.push(vertices.buffer, indices.buffer);
  }

  if ((object as Camera).isCamera) {
    components.push({
      type: "camera",
    });
  }

  return {
    components,
    children: object.children.map((child) => serializeGLTF(child, manager, transferList)),
  };
}

export function GLTFResourceLoader(manager: ResourceManager): ResourceLoader<GLTFDef, Object3D, RemoteGLTF> {
  const gltfLoader = new GLTFLoader();

  return {
    type: "gltf",
    async load({ name, url }) {
      const { scene } = await gltfLoader.loadAsync(url);

      scene.updateMatrixWorld(true);

      const transferList: Transferable[] = [];

      const serializedScene = serializeGLTF(scene, manager, transferList);

      return {
        name,
        resource: scene,
        remoteResource: {
          scene: serializedScene,
        },
        transferList,
      };
    },
  };
}
