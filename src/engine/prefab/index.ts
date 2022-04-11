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
    sceneDef.environmentTextureResourceId = loadRemoteResource(state.resourceManager, {
      type: "texture",
      textureType: TextureType.RGBE,
      url: props.environmentMapUrl,
    });
  }

  const sceneResourceId = loadRemoteResource(state.resourceManager, sceneDef);

  if (props.setActive === undefined || props.setActive) {
    setActiveScene(state, eid, sceneResourceId);
  }

  return eid;
}

export const createCube = (state: GameState, geometryResourceId: number) => {
  const { world, resourceManager, physicsWorld } = state;
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  const materialResourceId = loadRemoteResource(resourceManager, {
    type: "material",
    materialType: MaterialType.Physical,
    baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
    roughnessFactor: 0.8,
    metallicFactor: 0.8,
  });

  const resourceId = loadRemoteResource(resourceManager, {
    type: "mesh",
    geometryResourceId,
    materialResourceId,
  });

  const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
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
