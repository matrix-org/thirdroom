import * as RAPIER from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";

import { GameState } from "../GameWorker";
import { addChild, addTransformComponent, createTransformEntity } from "../component/transform";
import { setActiveCamera, setActiveScene, addRenderableComponent } from "../component/renderable";
import { addRigidBody } from "../physics";
import { MaterialType } from "../resources/MaterialResourceLoader";
import { SceneDefinition, SCENE_RESOURCE } from "../resources/SceneResourceLoader";
import { CameraType } from "../resources/CameraResourceLoader";
import { LightType, LIGHT_RESOURCE } from "../resources/LightResourceLoader";
import { loadRemoteResource } from "../resources/RemoteResourceManager";
import { TextureType } from "../resources/TextureResourceLoader";
import { GeometryType } from "../resources/GeometryResourceLoader";
import { playAudioFromWorker } from "../audio";

/* Prefab Factories */

interface SceneProps {
  setActive?: boolean;
  environmentMapUrl?: string;
}

export function createScene(state: GameState, props: SceneProps = {}): number {
  const eid = createTransformEntity(state.world);

  const sceneDef: SceneDefinition = {
    type: SCENE_RESOURCE,
  };

  if (props.environmentMapUrl) {
    const environmentMap = loadRemoteResource(state.resourceManager, {
      type: "texture",
      textureType: TextureType.RGBE,
      url: props.environmentMapUrl,
    });

    sceneDef.environmentTextureResourceId = environmentMap;
    sceneDef.backgroundTextureResourceId = environmentMap;
  }

  const sceneResourceId = loadRemoteResource(state.resourceManager, sceneDef);

  if (props.setActive === undefined || props.setActive) {
    setActiveScene(state, eid, sceneResourceId);
  }

  return eid;
}

export const createCube = (
  state: GameState,
  geometryResourceId: number = loadRemoteResource(state.resourceManager, {
    type: "geometry",
    geometryType: GeometryType.Box,
  }),
  materialResourceId = loadRemoteResource(state.resourceManager, {
    type: "material",
    materialType: MaterialType.Physical,
    baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
    roughnessFactor: 0.8,
    metallicFactor: 0.8,
  })
) => {
  const { world, resourceManager, physicsWorld } = state;
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  const resourceId = loadRemoteResource(resourceManager, {
    type: "mesh",
    geometryResourceId,
    materialResourceId,
  });

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS);
  physicsWorld.createCollider(colliderDesc, rigidBody.handle);

  addRigidBody(world, eid, rigidBody);
  addRenderableComponent(state, eid, resourceId);

  return eid;
};

export function createCamera(state: GameState, setActive = true): number {
  const eid = addEntity(state.world);
  addTransformComponent(state.world, eid);
  const cameraResource = loadRemoteResource(state.resourceManager, {
    type: "camera",
    cameraType: CameraType.Perspective,
    yfov: 75,
    znear: 0.1,
  });
  addRenderableComponent(state, eid, cameraResource);

  if (setActive) {
    setActiveCamera(state, eid);
  }

  return eid;
}

export function createDirectionalLight(state: GameState, parentEid?: number) {
  const eid = addEntity(state.world);
  addTransformComponent(state.world, eid);
  const lightResourceId = loadRemoteResource(state.resourceManager, {
    type: LIGHT_RESOURCE,
    lightType: LightType.Directional,
    intensity: 0.5,
  });
  addRenderableComponent(state, eid, lightResourceId);

  if (parentEid !== undefined) {
    addChild(parentEid, eid);
  }

  return eid;
}

/* Prefab Functions */

export interface PrefabTemplate {
  name: string;
  create: Function;
  delete?: Function;
  serialize?: Function;
  deserialize?: Function;
}

export function registerPrefab(state: GameState, template: PrefabTemplate) {
  if (state.prefabTemplateMap.has(template.name)) {
    console.warn("warning: overwriting existing prefab", template.name);
  }
  state.prefabTemplateMap.set(template.name, template);
  const create = template.create;

  template.create = () => {
    const eid = create();
    state.entityPrefabMap.set(eid, template.name);
    return eid;
  };
}

export function getPrefabTemplate(state: GameState, name: string) {
  return state.prefabTemplateMap.get(name);
}

export function registerDefaultPrefabs(state: GameState) {
  registerPrefab(state, {
    name: "random-cube",
    create: createCube,
  });
  registerPrefab(state, {
    name: "red-cube",
    create: () => {
      const eid = createCube(
        state,
        loadRemoteResource(state.resourceManager, {
          type: "geometry",
          geometryType: GeometryType.Box,
        }),
        loadRemoteResource(state.resourceManager, {
          type: "material",
          materialType: MaterialType.Physical,
          baseColorFactor: [1, 0, 0, 1.0],
          roughnessFactor: 0.8,
          metallicFactor: 0.8,
        })
      );
      return eid;
    },
  });
  registerPrefab(state, {
    name: "musical-cube",
    create: () => {
      const eid = createCube(
        state,
        loadRemoteResource(state.resourceManager, {
          type: "geometry",
          geometryType: GeometryType.Box,
        }),
        loadRemoteResource(state.resourceManager, {
          type: "material",
          materialType: MaterialType.Physical,
          baseColorFactor: [1, 0, 0, 1.0],
          roughnessFactor: 0.8,
          metallicFactor: 0.8,
        })
      );

      playAudioFromWorker("/audio/bach.mp3", eid);

      return eid;
    },
  });
  registerPrefab(state, {
    name: "green-cube",
    create: () =>
      createCube(
        state,
        loadRemoteResource(state.resourceManager, {
          type: "geometry",
          geometryType: GeometryType.Box,
        }),
        loadRemoteResource(state.resourceManager, {
          type: "material",
          materialType: MaterialType.Physical,
          baseColorFactor: [0, 1, 0, 1.0],
          roughnessFactor: 0.8,
          metallicFactor: 0.8,
        })
      ),
  });
  registerPrefab(state, {
    name: "blue-cube",
    create: () =>
      createCube(
        state,
        loadRemoteResource(state.resourceManager, {
          type: "geometry",
          geometryType: GeometryType.Box,
        }),
        loadRemoteResource(state.resourceManager, {
          type: "material",
          materialType: MaterialType.Physical,
          baseColorFactor: [0, 0, 1, 1.0],
          roughnessFactor: 0.8,
          metallicFactor: 0.8,
        })
      ),
  });
}
