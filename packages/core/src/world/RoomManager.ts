import {
  MatrixClient,
  MatrixEvent,
  RoomMember,
  RoomState,
} from "@robertlong/matrix-js-sdk";
import { GroupCall } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCall";
import { createWorld, pipe, addComponent } from "bitecs";
import EventEmitter from "events";
import { World } from "./World";
import { fetchGroupCall } from "../ui/matrix/fetchGroupCall";
import { ROOM_PROFILE_KEY } from "../ui/matrix/useRoomProfile";
import { ThreeModule } from "./three";
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
import { AvatarModule } from "./avatar";
import { PhysicsModule } from "./physics";
import {
  addPhysicsCharacterController,
  PhysicsCharacterControllerActions,
  PhysicsCharacterControllerSystem,
} from "./physics-character-controller";
import { CrouchSystem, CrouchMeshTarget, CrouchCameraTarget } from "./crouch";
import { addLinkRaycaster, LinkModule, LinkNavigateAction } from "./links";

export enum RoomManagerEvent {
  Error = "error",
  UpdateUI = "update-ui",
  RoomChanged = "room-changed",
  EnterRoom = "enter-room",
}

export interface RoomManager<S = {}> extends EventEmitter {
  state: S;
  init(canvas: HTMLCanvasElement, client: MatrixClient): Promise<void>;
  loadRoom(roomId: string): Promise<void>;
  unloadRoom(): void;
  dispose(): void;
}

export interface RoomManagerState {
  entered: boolean;
}

function getAvatarUrl(
  client: MatrixClient,
  groupCall: GroupCall,
  userId: string
): string | undefined {
  const memberStateEvent = groupCall.room.currentState.getStateEvents(
    "m.room.member",
    userId
  );

  if (!memberStateEvent) {
    return;
  }

  const profile = memberStateEvent.getContent()[ROOM_PROFILE_KEY];

  if (!profile) {
    return;
  }

  const avatarMxcUrl = profile.avatarMxcUrl;

  if (!avatarMxcUrl) {
    return;
  }

  const avatarUrl = client.mxcUrlToHttp(avatarMxcUrl);

  if (!avatarUrl) {
    return;
  }

  return avatarUrl;
}

export class MatrixRoomManager extends EventEmitter implements RoomManager {
  canvas?: HTMLCanvasElement;
  client?: MatrixClient;
  groupCall?: GroupCall;
  world?: World;
  state: RoomManagerState = { entered: false };
  disposeRoom?: () => void;

  constructor() {
    super();
    this.on(RoomManagerEvent.EnterRoom, this.onEnterRoom);
  }

  async init(canvas: HTMLCanvasElement, client: MatrixClient): Promise<void> {
    this.canvas = canvas;
    this.client = client;
    this.world = createWorld() as World;
  }

  async loadRoom(roomId: string): Promise<void> {
    const world = this.world!;
    const client = this.client!;
    const canvas = this.canvas!;
    const groupCall = (this.groupCall = await fetchGroupCall(client, roomId)!)!;

    const { scene, camera, audioListener, playerRig } = ThreeModule(world);

    const { setSceneUrl } = EnvironmentModule(world);

    const onRoomStateEvents = (
      event: MatrixEvent,
      _state: RoomState,
      _prevEvent: MatrixEvent
    ) => {
      if (
        event.getRoomId() === roomId &&
        event.getType() === "me.robertlong.scene"
      ) {
        const stateEvents = groupCall.room.currentState.getStateEvents(
          "me.robertlong.scene"
        );

        if (stateEvents.length > 0) {
          const mxcSceneUrl = event.getContent().sceneUrl;

          if (mxcSceneUrl) {
            const sceneUrl = client.mxcUrlToHttp(mxcSceneUrl);

            if (sceneUrl) {
              setSceneUrl(sceneUrl);
            }
          }
        }
      }
    };

    const stateEvents = groupCall.room.currentState.getStateEvents(
      "me.robertlong.scene"
    );

    if (stateEvents.length > 0) {
      const mxcSceneUrl = stateEvents[0].getContent().sceneUrl;

      if (mxcSceneUrl) {
        const sceneUrl = client.mxcUrlToHttp(mxcSceneUrl);

        if (sceneUrl) {
          setSceneUrl(sceneUrl);
        }
      }
    }

    client.on("RoomState.events", onRoomStateEvents);

    const {
      ReceiveMessagesSystem,
      SendMessagesSystem,
      dispose: disposeNetworkingModule,
      onAddParticipant,
      onRemoveParticipant,
    } = NetworkingModule(world, {
      localUserId: client.getUserId(),
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

    const {
      ParticipantNetworkTemplate,
      setParticipantAvatarUrl,
      setParticipantAudioStream,
    } = AvatarModule(world);

    function onRoomMemberStateChange(
      _event: MatrixEvent,
      _state: any,
      member: RoomMember
    ) {
      if (member.roomId !== groupCall.room.roomId) {
        return;
      }

      const nextAvatarUrl = getAvatarUrl(client, groupCall, member.userId);

      if (!nextAvatarUrl) {
        return;
      }

      setParticipantAvatarUrl(member.userId, nextAvatarUrl);
    }

    client.on("RoomState.members", onRoomMemberStateChange);

    const { LinkSystem } = LinkModule(world, {
      onChangeRoom: (roomId) => {
        this.emit(RoomManagerEvent.RoomChanged, roomId);
      },
    });

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

    this.disposeRoom = () => {
      disposeTimeModule();
      disposeRenderingModule();
      disposeInputModule();
      disposeNetworkingModule();
      client.removeListener("RoomState.events", onRoomStateEvents);
    };
  }

  onEnterRoom = () => {
    if (this.groupCall) {
      this.groupCall.enter().then(() => {
        this.state = { entered: true };
        this.emit(RoomManagerEvent.UpdateUI, this.state);
      });
    }
  };

  unloadRoom(): void {
    if (this.disposeRoom) {
      this.disposeRoom();
    }

    this.groupCall?.leave();
    this.groupCall = undefined;
    this.state = { entered: false };
    this.emit(RoomManagerEvent.UpdateUI, this.state);
  }

  dispose(): void {
    this.removeListener(RoomManagerEvent.EnterRoom, this.onEnterRoom);
  }
}
