import { AmbientLight } from "three";
import { addMapComponent, Object3DComponent, addAnimationClipsComponent, PositionalAudioEntity, AudioEntity, addRigidBodyComponent, PhysicsColliderShape, addAnimationMixerComponent, addEntity, Object3DEntity } from "threecs";
import { ThreeWorld } from "./createThreeWorld";

function createAudioElement(src: string) {
  const el = document.createElement("audio");
  el.addEventListener("canplay", () => {
    el.play();
  });
  el.src = src;
  return el;
}

export async function loadGltf(world: ThreeWorld, src: string) {
  const {
    scene: gltfScene,
    animations,
    parser: {
      options: { path: gltfPath },
    },
  } = await world.gltfLoader.loadAsync(
    src
  );
  const gltfRootPath = new URL(gltfPath, window.location.href).href;
  const gltfEid = addEntity(world);
  addMapComponent(world, Object3DComponent, gltfEid, gltfScene as unknown as Object3DEntity);

  // addObject3DComponent(world, gltfEid, gltfScene, sceneEid);
  addAnimationClipsComponent(world, gltfEid, animations);

  const animationMixerState: any[] = [];

  const gltfSceneEntity = gltfScene as unknown as Object3DEntity;

  gltfSceneEntity.traverse((child) => {
    const eid = addEntity(world);
    addMapComponent(world, Object3DComponent, eid, child);

    const components = child.userData.gltfExtensions?.MOZ_hubs_components;

    if (components) {
      if (components["visible"]) {
        child.visible = components["visible"].visible;
      }

      if (components["loop-animation"]) {
        const { activeClipIndices } = components["loop-animation"];
        for (const index of activeClipIndices) {
          animationMixerState.push({
            index,
            playing: true,
          });
        }
      }

      if (components["audio"]) {
        const { src, audioType, loop, volume, ...rest } = components["audio"];
        const absoluteUrl = new URL(src, gltfRootPath).href;
        const el = createAudioElement(absoluteUrl);
        el.loop = !!loop;

        let audio;

        if (audioType === "pannernode") {
          audio = new PositionalAudioEntity(world, world.audioListener);

          audio.setRefDistance(
            rest.refDistance !== undefined
              ? rest.refDistance
              : 1
          );
          audio.setRolloffFactor(
            rest.rolloffFactor !== undefined
              ? rest.rolloffFactor
              : 1
          );
          audio.setDistanceModel(rest.distanceModel || "inverse");
          audio.setMaxDistance(
            rest.maxDistance !== undefined
              ? rest.maxDistance
              : 10000
          );
          audio.setDirectionalCone(
            rest.coneInnerAngle !== undefined
              ? rest.coneInnerAngle
              : 360,
            rest.coneOuterAngle !== undefined
              ? rest.coneOuterAngle
              : 360,
            rest.coneOuterGain !== undefined
              ? rest.coneOuterGain
              : 0
          );
        } else {
          audio = new AudioEntity(world, world.audioListener);
        }

        audio.setMediaElementSource(el);
        audio.gain.gain.value = volume !== undefined ? volume : 1;
        child.add(audio);
      }
    }

    if (child.isMesh && !child.isSkinnedMesh) {
      if (
        components &&
        (components["nav-mesh"] || components["trimesh"])
      ) {
        return;
      }

      addRigidBodyComponent(world, eid, {
        shape: PhysicsColliderShape.Trimesh,
      });
    }
  });

  addAnimationMixerComponent(world, gltfEid, {
    state: animationMixerState,
  });

  return gltfSceneEntity;
}