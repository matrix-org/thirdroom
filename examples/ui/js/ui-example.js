let node;
let canvas;
let rootFlex;
let flexA;
let flexB;
let flexC;
let button;
let text;

const width = 5;
const height = 5;
const pixelDensity = 1000;

onload = () => {
  node = WebSG.createNode();

  canvas = WebSG.createUICanvas({ width, height, pixelDensity });
  WebSG.nodeAddUICanvas(node, canvas);

  root = WebSG.createUIFlex({
    width: width * pixelDensity,
    height: height * pixelDensity,
    backgroundColor: new Float32Array([0, 0, 0, 0.5]),
    borderColor: new Float32Array([1, 1, 1, 1]),
  });

  flexA = WebSG.createUIFlex({
    width: 400,
    height: 400,
    backgroundColor: new Float32Array([1, 0, 0, 1]),
    borderColor: new Float32Array([1, 1, 1, 1]),
  });

  flexB = WebSG.createUIFlex({
    width: 400,
    height: 400,
    backgroundColor: new Float32Array([0, 1, 0, 1]),
    borderColor: new Float32Array([1, 1, 1, 1]),
  });

  button = WebSG.createUIButton();

  text = WebSG.createUIText({
    value: "button pressed 0 times",
    fontSize: 12,
    color: new Float32Array([0, 0, 0, 1]),
  });

  flexC = WebSG.createUIFlex({
    width: 150,
    height: 150,
    backgroundColor: new Float32Array([0, 0, 1, 1]),
    borderColor: new Float32Array([1, 1, 1, 1]),
  });

  WebSG.uiFlexAddText(flexC, text);
  WebSG.uiFlexAddButton(flexC, button);

  WebSG.uiFlexAddChild(root, flexA);
  WebSG.uiFlexAddChild(root, flexB);
  WebSG.uiFlexAddChild(flexB, flexC);

  const scene = WebSG.getEnvironmentScene();
  WebSG.sceneAddNode(scene, node);
};

let x = 0;
onupdate = (dt) => {
  if (WebSG.uiButtonGetPressed(button)) {
    x++;
    WebSG.uiTextSetValue(text, "button pressed " + x + " times");
    WebSG.uiCanvasRedraw(canvas);
  }
};
