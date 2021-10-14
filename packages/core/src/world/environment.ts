import {
  AudioListener,
  AmbientLight,
  Object3D,
  Mesh,
  SkinnedMesh,
  InterleavedBufferAttribute,
  PlaneGeometry,
  MeshBasicMaterial,
  DoubleSide,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { addObject3DEntity, getObject3D, setObject3D } from "./three";
import { World } from "./World";
import { addRigidBodyComponent } from "./physics";
import { addLinkComponent } from "./links";
import { GLTFAudioEmitterExtension } from "three-omi";

export async function EnvironmentModule(
  world: World,
  {
    initialSceneUrl,
    audioListener,
  }: { initialSceneUrl?: string; audioListener: AudioListener }
) {
  const scene = getObject3D(world, world.sceneEid);
  world.environmentEid = addObject3DEntity(world, new Object3D(), scene);

  async function setSceneUrl(sceneUrl: string) {
    const gltfLoader = new GLTFLoader();

    const { scene } = await gltfLoader.loadAsync(sceneUrl);

    setObject3D(world, world.environmentEid, scene);

    gltfLoader.register(
      (parser) => new GLTFAudioEmitterExtension(parser, audioListener)
    );

    scene.traverse((child: any) => {
      if (child === scene) {
        return;
      }

      const childEid = addObject3DEntity(world, child);

      const components = child.userData.gltfExtensions?.MOZ_hubs_components;

      if (components) {
        if (components["visible"]) {
          child.visible = components["visible"].visible;
        }

        if (components["link"]) {
          addLinkComponent(world, childEid, components["link"].href);
        }
      }

      if (child.isMesh && !child.isSkinnedMesh) {
        if (components && (components["nav-mesh"] || components["trimesh"])) {
          return;
        }

        addRigidBodyComponent(world, childEid);
      }
    });

    scene.add(new AmbientLight());

    getObject3D(world, world.playerRigEid).position.set(0, 1, 0);
  }

  if (initialSceneUrl) {
    await setSceneUrl(initialSceneUrl);
  }

  return { setSceneUrl };
}
