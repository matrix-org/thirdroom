import { createWorld, pipe, addComponent } from "bitecs";
import {
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Plane,
  SphereBufferGeometry,
} from "three";
import { addObject3DEntity, ThreeModule } from "./three";
import { World } from "./World";
import { TimeModule } from "./time";
import { RenderingModule } from "./rendering";
import {
  NetworkingModule,
  addNetworkedComponent,
  getNetworkTemplateId,
} from "./networking";
import { InputModule, ActionType, BindingType } from "./input";
import {
  FirstPersonCameraSystem,
  FirstPersonCameraActions,
  FirstPersonCameraPitchTarget,
  FirstPersonCameraYawTarget,
} from "./first-person-camera";
import { EnvironmentModule } from "./environment";
import { GroupCall } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCall";
import { AvatarModule } from "./avatar";
import { MatrixClient } from "@robertlong/matrix-js-sdk";
import { PhysicsModule } from "./physics";
import {
  addPhysicsCharacterController,
  PhysicsCharacterControllerActions,
  PhysicsCharacterControllerSystem,
} from "./physics-character-controller";
import { CrouchSystem, CrouchMeshTarget, CrouchCameraTarget } from "./crouch";
import {
  addLinkComponent,
  addLinkRaycaster,
  LinkModule,
  LinkNavigateAction,
} from "./links";

export async function initWorld(
  canvas: HTMLCanvasElement,
  client: MatrixClient,
  groupCall: GroupCall,
  onChangeRoom: (roomId: string) => void,
  initialSceneUrl?: string
) {
  const world = createWorld() as World;

  const { scene, camera, audioListener, playerRig } = ThreeModule(world);

  const {
    ReceiveMessagesSystem,
    SendMessagesSystem,
    dispose: disposeNetworkingModule,
  } = NetworkingModule(world, {
    groupCall,
    networkTickInterval: 16,
  });

  const { TimeSystem, dispose: disposeTimeModule } = TimeModule(world);

  const {
    RenderingSystem,
    setAnimationLoop,
    dispose: disposeRenderingModule,
  } = RenderingModule(world, {
    canvas,
    antialias: true,
  });

  const {
    ActionMappingSystem,
    InputResetSystem,
    dispose: disposeInputModule,
  } = InputModule(world, {
    actionMaps: [
      {
        id: "movement",
        actions: [
          {
            id: "look",
            path: FirstPersonCameraActions.Look,
            type: ActionType.Vector2,
            bindings: [
              {
                type: BindingType.Axes,
                x: "Mouse/movementX",
                y: "Mouse/movementY",
              },
            ],
          },
          {
            id: "move",
            path: PhysicsCharacterControllerActions.Move,
            type: ActionType.Vector2,
            bindings: [
              {
                type: BindingType.DirectionalButtons,
                up: "Keyboard/KeyW",
                down: "Keyboard/KeyS",
                left: "Keyboard/KeyA",
                right: "Keyboard/KeyD",
              },
            ],
          },
          {
            id: "jump",
            path: PhysicsCharacterControllerActions.Jump,
            type: ActionType.Button,
            bindings: [
              {
                type: BindingType.Button,
                path: "Keyboard/Space",
              },
            ],
          },
          {
            id: "crouch",
            path: PhysicsCharacterControllerActions.Crouch,
            type: ActionType.Button,
            bindings: [
              {
                type: BindingType.Button,
                path: "Keyboard/KeyC",
              },
            ],
          },
          {
            id: "sprint",
            path: PhysicsCharacterControllerActions.Sprint,
            type: ActionType.Button,
            bindings: [
              {
                type: BindingType.Button,
                path: "Keyboard/ShiftLeft",
              },
            ],
          },
          {
            id: "activate",
            path: LinkNavigateAction,
            type: ActionType.Button,
            bindings: [
              {
                type: BindingType.Button,
                path: "Keyboard/KeyE",
              },
            ],
          },
        ],
      },
    ],
    pointerLock: true,
  });

  const { ParticipantNetworkTemplate } = AvatarModule(world, {
    client,
    groupCall,
  });

  const { LinkSystem } = LinkModule(world, { onChangeRoom });

  const { setSceneUrl } = await EnvironmentModule(world, { initialSceneUrl });

  const { PhysicsSystem } = await PhysicsModule(world);

  const pipeline = pipe(
    TimeSystem,
    ActionMappingSystem,
    ReceiveMessagesSystem,
    FirstPersonCameraSystem,
    PhysicsCharacterControllerSystem,
    CrouchSystem,
    PhysicsSystem,
    LinkSystem,
    SendMessagesSystem,
    RenderingSystem,
    InputResetSystem
  );

  setAnimationLoop(() => {
    pipeline(world);
  });

  addPhysicsCharacterController(world, world.playerRigEid);
  addComponent(world, FirstPersonCameraYawTarget, world.playerRigEid);
  addComponent(world, CrouchMeshTarget, world.playerRigEid);
  addComponent(world, FirstPersonCameraPitchTarget, world.cameraEid);
  addComponent(world, CrouchCameraTarget, world.cameraEid);
  addLinkRaycaster(world, world.cameraEid);
  addNetworkedComponent(
    world,
    world.playerRigEid,
    getNetworkTemplateId(world, ParticipantNetworkTemplate)!
  );

  const dispose = () => {
    disposeTimeModule();
    disposeRenderingModule();
    disposeInputModule();
    disposeNetworkingModule();
  };

  return {
    setSceneUrl,
    dispose,
  };
}
