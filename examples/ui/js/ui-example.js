let node;
let canvas;
let rootFlex;
let flexA;
let flexB;
let flexC;
let button;
let text;

const width = 5;
const height = 2.5;
const pixelDensity = 1000;

let tick = 0;

onload = () => {
  node = WebSG.createNode();

  WebSG.nodeSetPosition(node, new Float32Array([width / 2, height / 2, 0]));

  canvas = WebSG.UI.createUICanvas({ width, height, pixelDensity });
  WebSG.UI.nodeSetUICanvas(node, canvas);

  root = WebSG.UI.createUIFlex({
    width: width * pixelDensity,
    height: height * pixelDensity,
    backgroundColor: new Float32Array([0, 0, 0, 0.5]),
    borderColor: new Float32Array([1, 1, 1, 1]),
  });
  WebSG.UI.uiCanvasSetRoot(canvas, root);

  flexA = WebSG.UI.createUIFlex({
    width: 1000,
    height: 1000,
    backgroundColor: new Float32Array([1, 0, 0, 1]),
    borderColor: new Float32Array([1, 1, 1, 1]),
  });

  flexB = WebSG.UI.createUIFlex({
    width: 1000,
    height: 1000,
    backgroundColor: new Float32Array([0, 1, 0, 1]),
    borderColor: new Float32Array([1, 1, 1, 1]),
  });

  button = WebSG.UI.createUIButton("button label");

  text = WebSG.UI.createUIText({
    fontSize: 64,
    color: new Float32Array([0, 0, 0, 1]),
    // TODO: fix string passing
    // value: "button pressed 0 times",
    // fontFamily: "serif",
  });

  WebSG.UI.uiTextSetValue(text, "button pressed 0 times");

  flexC = WebSG.UI.createUIFlex({
    width: 800,
    height: 800,
    backgroundColor: new Float32Array([0, 0, 1, 1]),
    borderColor: new Float32Array([1, 1, 1, 1]),
  });

  WebSG.UI.uiFlexAddText(flexC, text);
  WebSG.UI.uiFlexAddButton(flexC, button);

  WebSG.UI.uiFlexAddChild(root, flexA);
  WebSG.UI.uiFlexAddChild(root, flexB);
  WebSG.UI.uiFlexAddChild(flexB, flexC);

  const scene = WebSG.getEnvironmentScene();
  WebSG.sceneAddNode(scene, node);

  WebSG.UI.uiCanvasRedraw(canvas);
};

let x = 0;
onupdate = (dt) => {
  if (button && WebSG.UI.uiButtonGetPressed(button)) {
    x++;
    WebSG.UI.uiTextSetValue(text, "button pressed " + x + " times");
    WebSG.UI.uiCanvasRedraw(canvas);
  }
};
