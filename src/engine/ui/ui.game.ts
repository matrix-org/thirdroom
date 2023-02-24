import * as RAPIER from "@dimforge/rapier3d-compat";
import { defineQuery } from "bitecs";

import { addInteractableComponent } from "../../plugins/interaction/interaction.game";
import { GameState } from "../GameTypes";
import { defineModule, registerMessageHandler } from "../module/module.common";
import { dynamicObjectCollisionGroups } from "../physics/CollisionGroups";
import { addRigidBody, PhysicsModuleState } from "../physics/physics.game";
import {
  createRemoteObject,
  RemoteNode,
  RemoteUIButton,
  RemoteUICanvas,
  RemoteUIFlex,
} from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { InteractableType } from "../resource/schema";
import { createDisposables } from "../utils/createDisposables";
import { UIButtonPressMessage, UIDoneDrawingMessage, WebSGUIMessage } from "./ui.common";

export const WebSGUIModule = defineModule<GameState, {}>({
  name: "GameWebSGUI",
  create: async () => {
    return {};
  },
  async init(ctx: GameState) {
    return createDisposables([
      registerMessageHandler(ctx, WebSGUIMessage.DoneDrawing, (ctx, message: UIDoneDrawingMessage) => {
        const uiCanvas = tryGetRemoteResource<RemoteUICanvas>(ctx, message.uiCanvasEid);
        uiCanvas!.needsRedraw = false;
      }),
      registerMessageHandler(ctx, WebSGUIMessage.ButtonPress, (ctx, message: UIButtonPressMessage) => {
        const button = tryGetRemoteResource<RemoteUIButton>(ctx, message.buttonEid);
        button.interactable!.pressed = true;
        button.interactable!.held = true;
      }),
    ]);
  },
});

const remoteUIButtonQuery = defineQuery([RemoteUIButton]);

export function ResetUIButtonInteractables(ctx: GameState) {
  const remoteButtons = remoteUIButtonQuery(ctx.world);
  for (let i = 0; i < remoteButtons.length; i++) {
    const eid = remoteButtons[i];
    const interactable = tryGetRemoteResource<RemoteUIButton>(ctx, eid).interactable;
    if (interactable) {
      interactable.pressed = false;
      interactable.released = false;
    }
  }
}

export function createUICanvasNode(
  ctx: GameState,
  physics: PhysicsModuleState,
  width: number,
  height: number,
  pixelDensity = 1000
) {
  const widthPx = width * pixelDensity;
  const heightPx = height * pixelDensity;

  const root = new RemoteUIFlex(ctx.resourceManager, {
    width: widthPx,
    height: heightPx,
  });

  const uiCanvas = new RemoteUICanvas(ctx.resourceManager, {
    root,
    width,
    height,
    pixelDensity,
  });

  const node = new RemoteNode(ctx.resourceManager, { uiCanvas });

  const obj = createRemoteObject(ctx, node);

  // add rigidbody for interactable UI
  const rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
  const rigidBody = physics.physicsWorld.createRigidBody(rigidBodyDesc);
  const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, 0.01)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
    .setCollisionGroups(dynamicObjectCollisionGroups);
  physics.physicsWorld.createCollider(colliderDesc, rigidBody);
  addRigidBody(ctx, obj, rigidBody);

  addInteractableComponent(ctx, physics, obj, InteractableType.Interactable);

  return obj;
}

function removeUIFlexFromLinkedList(parent: RemoteUIFlex, child: RemoteUIFlex) {
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

export function getLastUIFlexChild(parent: RemoteUIFlex): RemoteUIFlex | undefined {
  let cursor = parent.firstChild;

  let last = cursor;

  while (cursor) {
    last = cursor;
    cursor = cursor.nextSibling;
  }

  return last;
}

export function addUIFlexChild(parent: RemoteUIFlex, child: RemoteUIFlex) {
  child.addRef();

  const previousParent = child.parent;

  child.parent = parent;

  if (previousParent) {
    removeUIFlexFromLinkedList(previousParent, child);
  }

  const lastChild = getLastUIFlexChild(parent);

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
