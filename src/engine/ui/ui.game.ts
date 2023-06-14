import * as RAPIER from "@dimforge/rapier3d-compat";
import { vec2 } from "gl-matrix";

import {
  addInteractableComponent,
  InteractionModule,
  sendInteractionMessage,
} from "../../plugins/interaction/interaction.game";
import { GameContext } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { dynamicObjectCollisionGroups } from "../physics/CollisionGroups";
import { addRigidBody, PhysicsModuleState } from "../physics/physics.game";
import {
  RemoteAudioSource,
  RemoteNode,
  RemoteUIButton,
  RemoteUICanvas,
  RemoteUIElement,
} from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { InteractableType } from "../resource/schema";
import { createDisposables } from "../utils/createDisposables";
import { UIButtonFocusMessage, UIButtonPressMessage, UIButtonUnfocusMessage, WebSGUIMessage } from "./ui.common";
import { InteractableAction } from "../../plugins/interaction/interaction.common";
import { playOneShotAudio } from "../audio/audio.game";

export const WebSGUIModule = defineModule<GameContext, {}>({
  name: "GameWebSGUI",
  create: async () => {
    return {};
  },
  async init(ctx: GameContext) {
    return createDisposables([
      registerMessageHandler(ctx, WebSGUIMessage.ButtonPress, (ctx, message: UIButtonPressMessage) => {
        const button = tryGetRemoteResource<RemoteUIButton>(ctx, message.buttonEid);
        button.interactable!.pressed = true;
        button.interactable!.held = true;
        const interaction = getModule(ctx, InteractionModule);
        playOneShotAudio(ctx, interaction.clickEmitter?.sources[0] as RemoteAudioSource);
      }),
      registerMessageHandler(ctx, WebSGUIMessage.ButtonFocus, (ctx, message: UIButtonFocusMessage) => {
        sendInteractionMessage(ctx, InteractableAction.Focus, message.buttonEid);
      }),
      registerMessageHandler(ctx, WebSGUIMessage.ButtonUnfocus, (ctx, message: UIButtonUnfocusMessage) => {
        sendInteractionMessage(ctx, InteractableAction.Unfocus);
      }),
    ]);
  },
});

export function createUICanvasNode(
  ctx: GameContext,
  physics: PhysicsModuleState,
  size: vec2,
  width: number,
  height: number
) {
  const root = new RemoteUIElement(ctx.resourceManager, {
    width,
    height,
  });

  const uiCanvas = new RemoteUICanvas(ctx.resourceManager, {
    root,
    size,
    width,
    height,
  });

  const node = new RemoteNode(ctx.resourceManager, { uiCanvas });

  // add rigidbody for interactable UI
  const rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
  const rigidBody = physics.physicsWorld.createRigidBody(rigidBodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, 0.01)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
    .setCollisionGroups(dynamicObjectCollisionGroups);
  physics.physicsWorld.createCollider(colliderDesc, rigidBody);
  addRigidBody(ctx, node, rigidBody);

  addInteractableComponent(ctx, physics, node, InteractableType.UI);

  return node;
}

function removeUIElementFromLinkedList(parent: RemoteUIElement, child: RemoteUIElement) {
  const prevSibling = child.prevSibling;
  const nextSibling = child.nextSibling;

  parent.firstChild = undefined;

  // [prev, child, next]
  if (prevSibling && nextSibling) {
    prevSibling.nextSibling = nextSibling;
    nextSibling.prevSibling = prevSibling;
  }
  // [prev, child]
  if (prevSibling && !nextSibling) {
    prevSibling.nextSibling = undefined;
  }
  // [child, next]
  if (nextSibling && !prevSibling) {
    nextSibling.prevSibling = undefined;
    parent.firstChild = nextSibling;
  }
}

export function initNodeUICanvas(ctx: GameContext, physics: PhysicsModuleState, node: RemoteNode) {
  const { size } = node.uiCanvas!;

  // setup collider
  const rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
  const rigidBody = physics.physicsWorld.createRigidBody(rigidBodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, 0.01)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
    .setCollisionGroups(dynamicObjectCollisionGroups);
  physics.physicsWorld.createCollider(colliderDesc, rigidBody);

  addRigidBody(ctx, node, rigidBody);
  addInteractableComponent(ctx, physics, node, InteractableType.UI);
}

export function getLastUIElementChild(parent: RemoteUIElement): RemoteUIElement | undefined {
  let cursor = parent.firstChild;

  let last = cursor;

  while (cursor) {
    last = cursor;
    cursor = cursor.nextSibling;
  }

  return last;
}

export function addUIElementChild(parent: RemoteUIElement, child: RemoteUIElement) {
  child.addRef();

  const previousParent = child.parent;

  child.parent = parent;

  if (previousParent) {
    removeUIElementFromLinkedList(previousParent, child);
  }

  const lastChild = getLastUIElementChild(parent);

  if (lastChild) {
    lastChild.nextSibling = child;
    child.prevSibling = lastChild;
    child.nextSibling = undefined;
  } else {
    parent.firstChild = child;
    child.prevSibling = undefined;
    child.nextSibling = undefined;
  }

  child.removeRef();
}

export function removeUIElementChild(parent: RemoteUIElement, child: RemoteUIElement) {
  child.addRef();
  removeUIElementFromLinkedList(parent, child);
  child.parent = undefined;
  child.prevSibling = undefined;
  child.nextSibling = undefined;
  child.firstChild = undefined;
  child.removeRef();
}
