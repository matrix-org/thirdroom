import * as RAPIER from "@dimforge/rapier3d-compat";
import { defineQuery } from "bitecs";

import { addInteractableComponent } from "../../plugins/interaction/interaction.game";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { dynamicObjectCollisionGroups } from "../physics/CollisionGroups";
import { addRigidBody, PhysicsModule, PhysicsModuleState } from "../physics/physics.game";
import {
  addObjectToWorld,
  createRemoteObject,
  getObjectPublicRoot,
  RemoteImage,
  RemoteInteractable,
  RemoteNode,
  RemoteUIButton,
  RemoteUICanvas,
  RemoteUIFlex,
  RemoteUIImage,
  RemoteUIText,
} from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { InteractableType } from "../resource/schema";
import { createDisposables } from "../utils/createDisposables";
import { UIButtonPressMessage, WebSGUIMessage } from "./ui.common";

export const WebSGUIModule = defineModule<GameState, {}>({
  name: "GameWebSGUI",
  create: async () => {
    return {};
  },
  async init(ctx: GameState) {
    return createDisposables([
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

export async function createDemoUI(ctx: GameState): Promise<[RemoteUICanvas, RemoteUIButton, RemoteUIText]> {
  const physics = getModule(ctx, PhysicsModule);

  const obj = createUICanvasNode(ctx, physics, 5, 5, 1000);
  const node = getObjectPublicRoot(obj) as RemoteNode & { uiCanvas: RemoteUICanvas };

  const root = node.uiCanvas.root;

  root.backgroundColor.set([0, 0, 0, 0.5]);

  const button = new RemoteUIButton(ctx.resourceManager, {
    interactable: new RemoteInteractable(ctx.resourceManager, {
      type: InteractableType.Interactable,
    }),
  });

  const remoteImage = new RemoteImage(ctx.resourceManager, {
    uri: "/image/large-crate-icon.png",
  });

  const image = new RemoteUIImage(ctx.resourceManager, {
    source: remoteImage,
  });

  const text = new RemoteUIText(ctx.resourceManager, {
    value: "i am a button",
    fontSize: 118,
    fontFamily: "serif",
    fontStyle: "italic",
    fontWeight: "bold",
    color: [255, 255, 255, 1],
  });

  root.firstChild = new RemoteUIFlex(ctx.resourceManager, {
    width: 2000,
    height: 1500,
    parent: root,
    paddingTop: 80,
    paddingLeft: 80,
    backgroundColor: [0, 0, 0, 1],
    text,
    button,
    image,
  });

  obj.position[2] = -2.5;
  obj.position[1] = 2.5;

  addObjectToWorld(ctx, obj);

  return [node.uiCanvas, button, text];
}
