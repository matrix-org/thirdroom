// typedefs: https://github.com/facebook/yoga/blob/main/javascript/src_js/wrapAsm.d.ts
import { Yoga, Node, DIRECTION_LTR, Edge, PositionType, FlexDirection, Wrap, Align, Justify } from "yoga-wasm-web";
import { vec3 } from "gl-matrix";

import { getModule } from "../module/module.common";
import { RenderContext } from "./renderer.render";
import { RenderImage, RenderUIButton, RenderUICanvas, RenderUIElement, RenderUIText } from "./RenderResources";
import { RenderImageDataType } from "./textures";
import { LoadStatus } from "../resource/resource.common";
import { FlexEdge } from "../resource/schema";
import { RendererModule } from "./renderer.render";

export function findHitButton(uiCanvas: RenderUICanvas, hitPoint: vec3): RenderUIButton | undefined {
  const { size, width, height, root } = uiCanvas;

  const x = Math.ceil(((hitPoint[0] + size[0] / 2) / size[0]) * width);
  const y = Math.ceil((1 - (hitPoint[1] + size[1] / 2) / size[1]) * height);

  let button;

  traverseUIElements(root, (child) => {
    // TODO: iterate over array of buttons instead of traversing entire graph looking for buttons
    if (!child.button) return true;

    // if x and y is within this button's bounds, register a hit
    const layout = child.layout;

    if (x > layout.x && x < layout.x + layout.width && y > layout.y && y < layout.y + layout.height) {
      button = child.button;
      return false;
    }
  });

  return button;
}

function traverseUIElements(
  node: RenderUIElement,
  callback: (child: RenderUIElement, index: number) => boolean | void
) {
  let curChild = node.firstChild;
  let i = 0;

  while (curChild) {
    const continueTraversal = callback(curChild, i++) !== false;
    if (continueTraversal) {
      traverseUIElements(curChild, callback);
      curChild = curChild.nextSibling;
    } else {
      return;
    }
  }
}

export function updateUICanvas(ctx: RenderContext, uiCanvas: RenderUICanvas) {
  const { yoga, loadingImages, loadingText } = getModule(ctx, RendererModule);

  if (uiCanvas.redraw > uiCanvas.lastRedraw) {
    const ctx2d = uiCanvas.ctx2d!;
    updateCanvasLayout(ctx2d, yoga, uiCanvas);
    drawCanvas(ctx2d, uiCanvas, loadingImages, loadingText);

    // only stop rendering when all images have loaded
    if (loadingImages.size === 0 && loadingText.size === 0) {
      uiCanvas.lastRedraw = uiCanvas.redraw;
    }

    return true;
  }

  return false;
}

function updateCanvasLayout(ctx2d: OffscreenCanvasRenderingContext2D, yoga: Yoga, uiCanvas: RenderUICanvas) {
  const [process, node] = updateElementLayout(ctx2d, yoga, uiCanvas.root);
  node.calculateLayout(uiCanvas.root.width, uiCanvas.root.height, DIRECTION_LTR);
  process();
}

function updateElementLayout(
  ctx2d: OffscreenCanvasRenderingContext2D,
  yoga: Yoga,
  element: RenderUIElement
): [Function, Node] {
  const node = yoga.Node.create();

  const children: Function[] = [];
  updateYogaNode(ctx2d, node, element);

  let curChild = element.firstChild;

  while (curChild) {
    const [processChild, childNode] = updateElementLayout(ctx2d, yoga, curChild);
    const index = children.push(processChild);
    node.insertChild(childNode, index - 1);
    curChild = curChild.nextSibling;
  }

  function process(x = 0, y = 0) {
    const { left, top, width, height } = node.getComputedLayout();
    const layout = element.layout;
    layout.x = x + left;
    layout.y = y + top;
    layout.width = width;
    layout.height = height;

    for (let i = 0; i < children.length; i++) {
      children[i](layout.x, layout.y);
    }

    node.free();
  }

  return [process, node];
}

function updateYogaNode(ctx2d: OffscreenCanvasRenderingContext2D, yogaNode: Node, child: RenderUIElement) {
  yogaNode.setPositionType(child.positionType as PositionType);

  yogaNode.setPosition(FlexEdge.TOP as Edge, child.position[0]);
  yogaNode.setPosition(FlexEdge.RIGHT as Edge, child.position[1]);
  yogaNode.setPosition(FlexEdge.BOTTOM as Edge, child.position[2]);
  yogaNode.setPosition(FlexEdge.LEFT as Edge, child.position[3]);

  yogaNode.setWidth(child.width >= 0 ? child.width : "auto");
  yogaNode.setHeight(child.height >= 0 ? child.height : "auto");

  yogaNode.setMinWidth(child.minWidth >= 0 ? child.minWidth : 0);
  yogaNode.setMinHeight(child.minHeight >= 0 ? child.minHeight : 0);

  yogaNode.setMaxWidth(child.maxWidth >= 0 ? child.maxWidth : "100%");
  yogaNode.setMaxHeight(child.maxHeight >= 0 ? child.maxHeight : "100%");

  yogaNode.setMargin(FlexEdge.TOP as Edge, child.margin[0] >= 0 ? child.margin[0] : "auto");
  yogaNode.setMargin(FlexEdge.RIGHT as Edge, child.margin[1] >= 0 ? child.margin[1] : "auto");
  yogaNode.setMargin(FlexEdge.BOTTOM as Edge, child.margin[2] >= 0 ? child.margin[2] : "auto");
  yogaNode.setMargin(FlexEdge.LEFT as Edge, child.margin[3] >= 0 ? child.margin[3] : "auto");

  yogaNode.setBorder(FlexEdge.TOP as Edge, child.borderWidth[0]);
  yogaNode.setBorder(FlexEdge.RIGHT as Edge, child.borderWidth[1]);
  yogaNode.setBorder(FlexEdge.BOTTOM as Edge, child.borderWidth[2]);
  yogaNode.setBorder(FlexEdge.LEFT as Edge, child.borderWidth[3]);

  yogaNode.setPadding(FlexEdge.TOP as Edge, child.padding[0]);
  yogaNode.setPadding(FlexEdge.RIGHT as Edge, child.padding[1]);
  yogaNode.setPadding(FlexEdge.BOTTOM as Edge, child.padding[2]);
  yogaNode.setPadding(FlexEdge.LEFT as Edge, child.padding[3]);

  yogaNode.setFlexDirection(child.flexDirection as FlexDirection);
  if (child.flexBasis >= 0) yogaNode.setFlexBasis(child.flexBasis);
  yogaNode.setFlexWrap(child.flexWrap as Wrap);
  yogaNode.setFlexGrow(child.flexGrow);
  yogaNode.setFlexShrink(child.flexShrink);
  yogaNode.setAlignItems(child.alignItems as Align);
  yogaNode.setAlignSelf(child.alignSelf as Align);
  yogaNode.setAlignContent(child.alignContent as Align);
  yogaNode.setJustifyContent(child.justifyContent as Justify);

  if (child.text) {
    yogaNode.setMeasureFunc(() => {
      return getTextSize(ctx2d, child.text);
    });
  }
}

interface Size {
  width: number;
  height: number;
}

const rgbaToString = ([r, g, b, a]: Float32Array) => `rgba(${r * 255},${g * 255},${b * 255},${a})`;

const createFontString = (text: RenderUIText) =>
  `${text.fontStyle} ${text.fontWeight} ${text.fontSize || 12}px ${text.fontFamily || "sans-serif"}`.trim();

function getTextSize(ctx2d: OffscreenCanvasRenderingContext2D, text: RenderUIText): Size {
  ctx2d.textBaseline = "top";
  ctx2d.font = createFontString(text);
  const metrics = ctx2d.measureText(text.value);
  return {
    width: Math.ceil(metrics.width),
    height: Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent),
  };
}

function drawCanvas(
  ctx2d: OffscreenCanvasRenderingContext2D,
  uiCanvas: RenderUICanvas,
  loadingImages: Set<RenderImage>,
  loadingText: Set<RenderUIText>
) {
  ctx2d.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
  drawNode(ctx2d, loadingImages, loadingText, uiCanvas.root);
}

function drawNode(
  ctx2d: OffscreenCanvasRenderingContext2D,
  loadingImages: Set<RenderImage>,
  loadingText: Set<RenderUIText>,
  element: RenderUIElement
) {
  // Setup path
  const layout = element.layout;
  ctx2d.beginPath();
  ctx2d.roundRect(layout.x, layout.y, layout.width, layout.height, element.borderRadius);

  // Draw background
  ctx2d.fillStyle = rgbaToString(element.backgroundColor);
  ctx2d.fill();

  // Draw border
  ctx2d.strokeStyle = rgbaToString(element.borderColor);
  ctx2d.lineWidth = element.borderWidth[0]; // TODO: support independent border widths
  ctx2d.stroke();

  // Draw image
  if (element.image) {
    if (!element.image.source.imageData || element.image.source.loadStatus !== LoadStatus.Loaded) {
      loadingImages.add(element.image.source);
    } else if (element.image.source.imageData.type === RenderImageDataType.ImageBitmap) {
      loadingImages.delete(element.image.source);
      ctx2d.drawImage(
        element.image.source.imageData.data as ImageBitmap,
        layout.x,
        layout.y,
        layout.width,
        layout.height
      );
    }
  }

  // Draw text
  if (element.text) {
    if (element.text.value === undefined) {
      loadingText.add(element.text);
    } else {
      loadingText.delete(element.text);
      ctx2d.textBaseline = "top";
      ctx2d.font = createFontString(element.text);
      ctx2d.fillStyle = rgbaToString(element.text.color);
      ctx2d.fillText(element.text.value, layout.x + element.padding[3], layout.y + element.padding[0]);
    }
  }

  // Draw children
  let curChild = element.firstChild;

  while (curChild) {
    drawNode(ctx2d, loadingImages, loadingText, curChild);
    curChild = curChild.nextSibling;
  }
}
