// typedefs: https://github.com/facebook/yoga/blob/main/javascript/src_js/wrapAsm.d.ts
import Yoga from "@react-pdf/yoga";
import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, Texture } from "three";
import { Scene } from "three";

import { defineModule, getModule, registerMessageHandler, Thread } from "../module/module.common";
import { RenderThreadState } from "../renderer/renderer.render";
import { RenderImage, RenderNode, RenderUICanvas, RenderUIFlex, RenderUIText } from "../resource/resource.render";
import { createDisposables } from "../utils/createDisposables";
import { updateTransformFromNode } from "../node/node.render";
import { UICanvasInteractionMessage, traverseUIFlex, WebSGUIMessage, UIButtonPressMessage } from "./ui.common";
import { getLocalResource } from "../resource/resource.render";
import { RenderImageDataType } from "../utils/textures";
import { LoadStatus } from "../resource/resource.common";

export const WebSGUIModule = defineModule<
  RenderThreadState,
  {
    loadingImages: Set<RenderImage>;
    loadingText: Set<RenderUIText>;
  }
>({
  name: "MainWebSGUI",
  create: async () => {
    return {
      loadingImages: new Set(),
      // HACK: figure out why sometimes text.value is undefined
      loadingText: new Set(),
    };
  },
  async init(ctx: RenderThreadState) {
    return createDisposables([registerMessageHandler(ctx, WebSGUIMessage.CanvasInteraction, onButtonPress)]);
  },
});

function onButtonPress(ctx: RenderThreadState, message: UICanvasInteractionMessage): void {
  const uiCanvas = getLocalResource<RenderUICanvas>(ctx, message.uiCanvasEid);
  if (uiCanvas) {
    const { pixelDensity, width, height, root } = uiCanvas;

    const x = message.hitPoint[0] * pixelDensity + (width * pixelDensity) / 2;
    const y = -(message.hitPoint[1] * pixelDensity - (height * pixelDensity) / 2);

    // TODO: optimize
    traverseUIFlex(root, (child) => {
      const layout = child.yogaNode.getComputedLayout();

      // if x and y is within this button's bounds, register a hit
      if (
        child.button &&
        x > layout.left &&
        x < layout.left + layout.width &&
        y > layout.top &&
        y < layout.top + layout.height
      ) {
        ctx.sendMessage<UIButtonPressMessage>(Thread.Game, {
          type: WebSGUIMessage.ButtonPress,
          buttonEid: child.button.eid,
        });

        return false;
      }
    });
  }
}

const rgbaToString = ([r, g, b, a]: Float32Array) => `rgba(${r},${g},${b},${a})`;

function drawNode(
  ctx2d: CanvasRenderingContext2D,
  loadingImages: Set<RenderImage>,
  loadingText: Set<RenderUIText>,
  node: RenderUIFlex
) {
  if (!node.yogaNode) {
    console.warn("yoga node not found for eid", node.eid);
    return;
  }

  // setup brush
  ctx2d.fillStyle = rgbaToString(node.backgroundColor);
  ctx2d.strokeStyle = rgbaToString(node.strokeColor);

  // draw layout
  const layout = node.yogaNode.getComputedLayout();

  // HACK?: crawl up the parent chain to calculate global top & left values, unsure if necessary or bug in yoga
  let parent = node.parent;
  while (parent) {
    const parentLayout = parent.yogaNode.getComputedLayout();
    layout.top += parentLayout.top;
    layout.left += parentLayout.left;
    parent = parent.parent;
  }

  if (node.backgroundColor) ctx2d.fillRect(layout.left, layout.top, layout.width, layout.height);
  if (node.strokeColor) ctx2d.strokeRect(layout.left, layout.top, layout.width, layout.height);

  // draw image
  if (node.image) {
    if (!node.image.source.imageData || node.image.source.loadStatus !== LoadStatus.Loaded) {
      loadingImages.add(node.image.source);
    } else if (node.image.source.imageData.type === RenderImageDataType.ImageBitmap) {
      loadingImages.delete(node.image.source);
      ctx2d.drawImage(
        node.image.source.imageData.data as ImageBitmap,
        layout.left,
        layout.top,
        layout.width,
        layout.height
      );
    }
  }

  // draw text
  if (node.text) {
    if (node.text.value === undefined) {
      loadingText.add(node.text);
    } else {
      loadingText.delete(node.text);
      ctx2d.textBaseline = "top";
      ctx2d.font = `${node.text.fontStyle} ${node.text.fontWeight} ${node.text.fontSize || 12}px ${
        node.text.fontFamily || "sans-serif"
      }`.trim();
      ctx2d.fillStyle = rgbaToString(node.text.color);
      ctx2d.fillText(node.text.value, layout.left + node.paddingLeft, layout.top + node.paddingTop);
    }
  }

  // TODO
  // if (node.button) {
  // }

  return ctx2d;
}

function updateYogaNode(child: RenderUIFlex) {
  child.yogaNode.setFlexDirection(child.flexDirection);

  child.yogaNode.setWidth(child.width);
  child.yogaNode.setHeight(child.height);

  child.yogaNode.setPadding(Yoga.EDGE_TOP, child.paddingTop);
  child.yogaNode.setPadding(Yoga.EDGE_BOTTOM, child.paddingBottom);
  child.yogaNode.setPadding(Yoga.EDGE_LEFT, child.paddingLeft);
  child.yogaNode.setPadding(Yoga.EDGE_RIGHT, child.paddingRight);

  child.yogaNode.setMargin(Yoga.EDGE_TOP, child.marginTop);
  child.yogaNode.setMargin(Yoga.EDGE_BOTTOM, child.marginBottom);
  child.yogaNode.setMargin(Yoga.EDGE_LEFT, child.marginLeft);
  child.yogaNode.setMargin(Yoga.EDGE_RIGHT, child.marginRight);

  // TODO: add remainder of Yoga.Node API
  child.yogaNode.setPositionType(Yoga.POSITION_TYPE_RELATIVE);
  child.yogaNode.setJustifyContent(Yoga.JUSTIFY_FLEX_START);
}

export function updateNodeUICanvas(ctx: RenderThreadState, scene: Scene, node: RenderNode) {
  const currentUICanvasResourceId = node.currentUICanvasResourceId;
  const nextUICanvasResourceId = node.uiCanvas?.eid || 0;

  // if uiCanvas changed
  if (currentUICanvasResourceId !== nextUICanvasResourceId && node.uiCanvas) {
    // teardown
    if (node.uiCanvas.root.yogaNode) {
      if (node.uiCanvas.root.yogaNode) Yoga.Node.destroy(node.uiCanvas.root.yogaNode);
      traverseUIFlex(node.uiCanvas.root, (child) => {
        if (child.yogaNode) {
          Yoga.Node.destroy(child.yogaNode);
        }
      });
    }
  }

  node.currentUICanvasResourceId = nextUICanvasResourceId;

  if (!node.uiCanvas) {
    return;
  }

  // create

  const uiCanvas = node.uiCanvas;

  if (!node.uiCanvasMesh || !uiCanvas.canvas) {
    uiCanvas.canvas = document.createElement("canvas");
    uiCanvas.canvas.width = uiCanvas.root.width;
    uiCanvas.canvas.height = uiCanvas.root.height;

    // create & update root yoga node
    uiCanvas.root.yogaNode = Yoga.Node.create();
    updateYogaNode(uiCanvas.root);

    // traverse root, create & update yoga nodes
    traverseUIFlex(uiCanvas.root, (child, i) => {
      child.yogaNode = Yoga.Node.create();

      // if not root
      if (child.parent) {
        // attach to parent
        console.log(`inserting child ${child.eid} into parent ${child.parent.eid} at index ${i}`);
        child.parent.yogaNode.insertChild(child.yogaNode, i);
      }

      updateYogaNode(child);
    });

    uiCanvas.canvasTexture = new CanvasTexture(uiCanvas.canvas);

    node.uiCanvasMesh = new Mesh(
      new PlaneGeometry(uiCanvas.width, uiCanvas.height),
      new MeshBasicMaterial({ map: uiCanvas.canvasTexture, transparent: true })
    );

    scene.add(node.uiCanvasMesh);
  }

  // update

  const { loadingImages, loadingText } = getModule(ctx, WebSGUIModule);

  if (uiCanvas.redraw > uiCanvas.lastRedraw) {
    const ctx2d = uiCanvas.canvas.getContext("2d") as CanvasRenderingContext2D;

    ctx2d.clearRect(0, 0, uiCanvas.root.width, uiCanvas.root.height);

    // calculate layout
    uiCanvas.root.yogaNode.calculateLayout(uiCanvas.root.width, uiCanvas.root.height, Yoga.DIRECTION_LTR);

    // draw root
    drawNode(ctx2d, loadingImages, loadingText, uiCanvas.root);

    // draw children
    traverseUIFlex(uiCanvas.root, (child) => {
      drawNode(ctx2d, loadingImages, loadingText, child);
    });

    (node.uiCanvasMesh.material as MeshBasicMaterial & { map: Texture }).map.needsUpdate = true;

    // only stop rendering when all images have loaded
    if (loadingImages.size === 0 && loadingText.size === 0) {
      uiCanvas.lastRedraw = uiCanvas.redraw;
    }
  }

  // update the canvas mesh transform with the node's
  updateTransformFromNode(ctx, node, node.uiCanvasMesh);
}
