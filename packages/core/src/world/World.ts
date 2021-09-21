import { WebGLRenderer, Object3D, ArrowHelper } from "three";
import { NetworkTemplate } from "./networking";
import { ActionMap, ActionState } from "./input";
import { GroupCallParticipant } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCallParticipant";
import Rapier from "@dimforge/rapier3d-compat";

export interface World {
  // Entities
  sceneEid: number;
  cameraEid: number;
  audioListenerEid: number;
  playerRigEid: number;

  // Three
  entityToObject3D: Object3D[];
  object3DToEntity: Map<Object3D, number>;

  // Time
  delta: number;
  elapsed: number;

  // Environment
  environmentEid: number;

  // Input
  input: Map<string, number>;
  actionMaps: ActionMap[];
  actions: Map<string, ActionState>;

  // Networking
  networkTemplates: NetworkTemplate[];
  networkTemplateIds: Map<NetworkTemplate, number>;
  networkIdToTemplate: Map<number, NetworkTemplate>;
  networkIdToEntity: Map<number, number>;
  localParticipantId: number;
  participantToParticipantId: Map<GroupCallParticipant, number>;
  participantIdToParticipant: Map<number, GroupCallParticipant>;

  // Rendering
  renderer: WebGLRenderer;
  resizeViewport: boolean;

  // Physics
  physicsWorld: Rapier.World;
  colliderHandleToEntityMap: Map<number, number>;
  entityToShape: Map<number, Rapier.Shape>;
  entityToCollider: Map<number, Rapier.Collider>;
  entityToRigidBody: Map<number, Rapier.RigidBody>;
  entityToRay: Map<number, Rapier.Ray>;
  entityToArrowHelper: Map<number, ArrowHelper>;

  // Links
  entityToLinkUrl: Map<number, string>;
}
