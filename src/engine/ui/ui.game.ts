import * as RAPIER from "@dimforge/rapier3d-compat";

import {
  addInteractableComponent,
  InteractionModule,
  sendInteractionMessage,
} from "../../plugins/interaction/interaction.game";
import { moveCursorView, readFloat32, readFloat32Array, readUint32 } from "../allocator/CursorView";
import { GameState } from "../GameTypes";
import { defineModule, getModule, registerMessageHandler } from "../module/module.common";
import { dynamicObjectCollisionGroups } from "../physics/CollisionGroups";
import { addRigidBody, PhysicsModule, PhysicsModuleState } from "../physics/physics.game";
import {
  addObjectToWorld,
  createRemoteObject,
  getObjectPublicRoot,
  RemoteAudioSource,
  RemoteNode,
  RemoteUIButton,
  RemoteUICanvas,
  RemoteUIFlex,
  RemoteUIText,
} from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { InteractableType } from "../resource/schema";
import { readString, WASMModuleContext, writeFloat32Array } from "../scripting/WASMModuleContext";
import { getScriptResource } from "../scripting/websg";
import { createDisposables } from "../utils/createDisposables";
import { UIButtonFocusMessage, UIButtonPressMessage, UIButtonUnfocusMessage, WebSGUIMessage } from "./ui.common";
import { readString as readStringCursorView } from "../allocator/CursorView";
import { InteractableAction } from "../../plugins/interaction/interaction.common";
import { playOneShotAudio } from "../audio/audio.game";

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

export function createWebSGUIModule(ctx: GameState, wasmCtx: WASMModuleContext) {
  const physics = getModule(ctx, PhysicsModule);

  return {
    // UI Canvas

    create_ui_canvas(propsPtr: number) {
      moveCursorView(wasmCtx.cursorView, propsPtr);
      const width = readFloat32(wasmCtx.cursorView);
      const height = readFloat32(wasmCtx.cursorView);
      const pixelDensity = readFloat32(wasmCtx.cursorView);
      // createDemoUI(ctx);

      try {
        const uiCanvas = new RemoteUICanvas(wasmCtx.resourceManager, {
          width,
          height,
          pixelDensity,
        });
        return uiCanvas.eid;
      } catch (e) {
        console.error("WebSG: error creating ui canvas", e);
        return -1;
      }
    },
    node_set_ui_canvas(nodeId: number, canvasId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas || !node) {
        return -1;
      }

      node.uiCanvas = canvas;

      const { width, height } = canvas;

      // setup collider
      const rigidBodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased();
      const rigidBody = physics.physicsWorld.createRigidBody(rigidBodyDesc);
      const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, 0.01)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
        .setCollisionGroups(dynamicObjectCollisionGroups);
      physics.physicsWorld.createCollider(colliderDesc, rigidBody);

      addRigidBody(ctx, node, rigidBody);

      addInteractableComponent(ctx, physics, node, InteractableType.UI);

      return 0;
    },
    ui_canvas_set_root(canvasId: number, rootId: number) {
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas) {
        return -1;
      }

      const flex = getScriptResource(wasmCtx, RemoteUIFlex, rootId);

      if (!flex) {
        return -1;
      }

      canvas.root = flex;

      return 0;
    },
    ui_canvas_set_width(canvasId: number, width: number) {
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas) {
        return -1;
      }

      canvas.width = width;

      return 0;
    },
    ui_canvas_set_height(canvasId: number, height: number) {
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas) {
        return -1;
      }

      canvas.height = height;

      return 0;
    },
    ui_canvas_set_pixel_density(canvasId: number, pixelDensity: number) {
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas) {
        return -1;
      }

      canvas.pixelDensity = pixelDensity;

      return 0;
    },
    ui_canvas_redraw(canvasId: number) {
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas) {
        return -1;
      }

      canvas.redraw++;

      return 0;
    },

    // UI Flex

    create_ui_flex(propsPtr: number) {
      moveCursorView(wasmCtx.cursorView, propsPtr);
      const width = readFloat32(wasmCtx.cursorView);
      const height = readFloat32(wasmCtx.cursorView);
      const flexDirection = readUint32(wasmCtx.cursorView);
      const backgroundColor = readFloat32Array(wasmCtx.cursorView, 4);
      const borderColor = readFloat32Array(wasmCtx.cursorView, 4);
      const padding = readFloat32Array(wasmCtx.cursorView, 4);
      const margin = readFloat32Array(wasmCtx.cursorView, 4);

      try {
        const uiFlex = new RemoteUIFlex(wasmCtx.resourceManager, {
          width,
          height,
          flexDirection,
          backgroundColor,
          borderColor,
          padding,
          margin,
        });
        return uiFlex.eid;
      } catch (e) {
        console.error("WebSG: error creating ui flex", e);
        return -1;
      }
    },
    ui_flex_set_flex_direction(flexId: number, flexDirection: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIFlex, flexId);

      if (!flex) {
        return -1;
      }

      flex.flexDirection = flexDirection;

      return 0;
    },
    ui_flex_set_width(flexId: number, width: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIFlex, flexId);

      if (!flex) {
        return -1;
      }

      flex.width = width;

      return 0;
    },
    ui_flex_set_height(flexId: number, height: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIFlex, flexId);

      if (!flex) {
        return -1;
      }

      flex.height = height;

      return 0;
    },
    ui_flex_set_background_color(flexId: number, colorPtr: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIFlex, flexId);

      if (!flex) {
        return -1;
      }

      writeFloat32Array(wasmCtx, colorPtr, flex.backgroundColor);

      return 0;
    },
    ui_flex_set_border_color(flexId: number, colorPtr: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIFlex, flexId);

      if (!flex) {
        return -1;
      }

      writeFloat32Array(wasmCtx, colorPtr, flex.borderColor);

      return 0;
    },
    ui_flex_set_padding(flexId: number, paddingPtr: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIFlex, flexId);

      if (!flex) {
        return -1;
      }

      writeFloat32Array(wasmCtx, paddingPtr, flex.padding);

      return 0;
    },
    ui_flex_set_margin(flexId: number, marginPtr: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIFlex, flexId);

      if (!flex) {
        return -1;
      }

      writeFloat32Array(wasmCtx, marginPtr, flex.margin);

      return 0;
    },
    ui_flex_add_child(flexId: number, childId: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIFlex, flexId);

      if (!flex) {
        return -1;
      }

      const child = getScriptResource(wasmCtx, RemoteUIFlex, childId);

      if (!child) {
        return -1;
      }

      addUIFlexChild(flex, child);

      return 0;
    },
    ui_flex_add_text(flexId: number, textId: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIFlex, flexId);

      if (!flex) {
        return -1;
      }

      const text = getScriptResource(wasmCtx, RemoteUIText, textId);

      if (!text) {
        return -1;
      }

      flex.text = text;

      return 0;
    },

    ui_flex_add_button(flexId: number, buttonId: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIFlex, flexId);

      if (!flex) {
        return -1;
      }

      const button = getScriptResource(wasmCtx, RemoteUIButton, buttonId);

      if (!button) {
        return -1;
      }

      flex.button = button;

      return 0;
    },

    // UI Button

    create_ui_button(labelPtr: number, length: number) {
      const label = readString(wasmCtx, labelPtr, length);
      try {
        const uiBtn = new RemoteUIButton(wasmCtx.resourceManager, { label });
        addInteractableComponent(ctx, physics, uiBtn, InteractableType.UI);
        return uiBtn.eid;
      } catch (e) {
        console.error("WebSG: error creating ui button", e);
        return -1;
      }
    },
    ui_button_set_label(btnId: number, labelPtr: number, length: number) {
      const btn = getScriptResource(wasmCtx, RemoteUIButton, btnId);

      if (!btn) {
        return -1;
      }

      const label = readString(wasmCtx, labelPtr, length);

      if (!label) {
        return -1;
      }

      btn.label = label;

      return 0;
    },
    ui_button_get_pressed(btnId: number) {
      const btn = getScriptResource(wasmCtx, RemoteUIButton, btnId);

      if (!btn) {
        return -1;
      }

      const interactable = btn.interactable;

      if (!interactable) {
        return -1;
      }

      return interactable.pressed ? 1 : 0;
    },
    ui_button_get_held(btnId: number) {
      const btn = getScriptResource(wasmCtx, RemoteUIButton, btnId);

      if (!btn) {
        return -1;
      }

      const interactable = btn.interactable;

      if (!interactable) {
        return -1;
      }

      return interactable.held ? 1 : 0;
    },
    ui_button_get_released(btnId: number) {
      const btn = getScriptResource(wasmCtx, RemoteUIButton, btnId);

      if (!btn) {
        return -1;
      }

      const interactable = btn.interactable;

      if (!interactable) {
        return -1;
      }

      return interactable.released ? 1 : 0;
    },

    // UI Text

    create_ui_text(propsPtr: number) {
      moveCursorView(wasmCtx.cursorView, propsPtr);

      const fontSize = readFloat32(wasmCtx.cursorView);
      const color = readFloat32Array(wasmCtx.cursorView, 4);
      const value = readStringCursorView(wasmCtx.cursorView, Uint16Array.BYTES_PER_ELEMENT);
      // const fontFamily = readStringCursorView(wasmCtx.cursorView, Uint8Array.BYTES_PER_ELEMENT);
      // const fontWeight = readStringCursorView(wasmCtx.cursorView, Uint8Array.BYTES_PER_ELEMENT);
      // const fontStyle = readStringCursorView(wasmCtx.cursorView, Uint8Array.BYTES_PER_ELEMENT);

      try {
        const uiText = new RemoteUIText(wasmCtx.resourceManager, {
          value,
          color,
          fontSize,
          // fontFamily,
          // fontWeight,
          // fontStyle,
        });
        return uiText.eid;
      } catch (e) {
        console.error("WebSG: error creating ui flex", e);
        return -1;
      }
    },
    ui_text_set_value(textId: number, valuePtr: number, byteLength: number) {
      const value = readString(wasmCtx, valuePtr, byteLength);
      const flex = getScriptResource(wasmCtx, RemoteUIText, textId);

      if (!flex) {
        return -1;
      }

      flex.value = value;

      return 0;
    },
    ui_text_set_font_size(textId: number, fontSize: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIText, textId);

      if (!flex) {
        return -1;
      }

      flex.fontSize = fontSize;

      return 0;
    },
    ui_text_set_font_family(textId: number, valuePtr: number, byteLength: number) {
      const fontFamily = readString(wasmCtx, valuePtr, byteLength);
      const flex = getScriptResource(wasmCtx, RemoteUIText, textId);

      if (!flex) {
        return -1;
      }

      flex.fontFamily = fontFamily;

      return 0;
    },
    ui_text_set_font_style(textId: number, valuePtr: number, byteLength: number) {
      const fontStyle = readString(wasmCtx, valuePtr, byteLength);
      const flex = getScriptResource(wasmCtx, RemoteUIText, textId);

      if (!flex) {
        return -1;
      }

      flex.fontStyle = fontStyle;

      return 0;
    },
    ui_text_set_color(textId: number, colorPtr: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIText, textId);

      if (!flex) {
        return -1;
      }

      writeFloat32Array(wasmCtx, colorPtr, flex.color);

      return 0;
    },
  };
}

export function createUICanvasNode(
  ctx: GameState,
  physics: PhysicsModuleState,
  width: number,
  height: number,
  pixelDensity = 1000
) {
  // const widthPx = width * pixelDensity;
  // const heightPx = height * pixelDensity;

  // const root = new RemoteUIFlex(ctx.resourceManager, {
  //   width: widthPx,
  //   height: heightPx,
  // });

  const uiCanvas = new RemoteUICanvas(ctx.resourceManager, {
    // root,
    width,
    height,
    pixelDensity,
  });

  // setTimeout(() => {
  // uiCanvas.root = root;
  // }, 10);

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

  addInteractableComponent(ctx, physics, obj, InteractableType.UI);

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

// Smoke testing purposes
export async function createDemoUI(ctx: GameState): Promise<[RemoteUICanvas, RemoteUIButton, RemoteUIText]> {
  const physics = getModule(ctx, PhysicsModule);

  const obj = createUICanvasNode(ctx, physics, 5, 5, 1000);
  const node = getObjectPublicRoot(obj) as RemoteNode & { uiCanvas: RemoteUICanvas };

  // const root = node.uiCanvas.root;

  const widthPx = 5 * 1000;
  const heightPx = 5 * 1000;
  setTimeout(() => {
    const root = new RemoteUIFlex(ctx.resourceManager, {
      width: widthPx,
      height: heightPx,
      backgroundColor: [0, 0, 0, 0.5],
    });

    node.uiCanvas.root = root;

    // const button = new RemoteUIButton(ctx.resourceManager, {
    //   label: "button label",
    // });

    // addInteractableComponent(ctx, physics, button, InteractableType.UI);

    // const remoteImage = new RemoteImage(ctx.resourceManager, {
    //   uri: "/image/large-crate-icon.png",
    // });

    // const image = new RemoteUIImage(ctx.resourceManager, {
    //   source: remoteImage,
    // });

    // const text = new RemoteUIText(ctx.resourceManager, {
    //   value: "i am a button",
    //   fontSize: 118,
    //   fontFamily: "serif",
    //   fontStyle: "italic",
    //   fontWeight: "bold",
    //   color: [255, 255, 255, 1],
    // });

    // const flex = new RemoteUIFlex(ctx.resourceManager, {
    //   width: 2000,
    //   height: 1500,
    //   padding: [80, 0, 0, 80],
    //   backgroundColor: [0, 0, 0, 1],
    //   text,
    //   button,
    //   image,
    // });

    // const flex1 = new RemoteUIFlex(ctx.resourceManager, {
    //   width: 2000,
    //   height: 1500,
    //   backgroundColor: [0, 0, 0, 0.7],
    // });

    // const flex2 = new RemoteUIFlex(ctx.resourceManager, {
    //   width: 500,
    //   height: 500,
    //   backgroundColor: [255 / 10, 255 / 10, 255 / 10, 1],
    // });

    // const flex3 = new RemoteUIFlex(ctx.resourceManager, {
    //   width: 500,
    //   height: 500,
    //   backgroundColor: [255 / 5, 255 / 5, 255 / 5, 1],
    // });

    // const flex4 = new RemoteUIFlex(ctx.resourceManager, {
    //   width: 100,
    //   height: 100,
    //   backgroundColor: [255 / 1.5, 255 / 1.5, 255 / 1.5, 1],
    // });

    // addUIFlexChild(root, flex);
    // addUIFlexChild(root, flex1);
    // addUIFlexChild(flex1, flex2);
    // addUIFlexChild(flex1, flex3);
    // addUIFlexChild(flex3, flex4);

    obj.position[2] = -2.5;
    obj.position[1] = 2.5;

    addObjectToWorld(ctx, obj);
  }, 100);

  // return [node.uiCanvas, button, text];
}
