let node;
let canvas;
let root;
let elA;
let elB;
let elC;
let button;
let text;

const panelStyle = {
  backgroundColor: [0, 0, 0, 0.5],
  borderColor: [1, 1, 1, 1],
  borderRadius: [64, 64, 64, 64],
  borderWidth: [12, 12, 12, 12],
  padding: [12, 12, 12, 12],
};

world.onload = () => {
  node = world.createNode();
  node.translation.x = 2.5;
  node.translation.y = 1.25;

  canvas = world.createUICanvas({
    width: 1024,
    height: 1024 / 2,
    size: [5, 2.5],
  });

  node.uiCanvas = canvas;

  root = world.createUIElement({
    ...panelStyle,
    width: 1000,
    height: 1000,
    margin: [12, 12, 12, 12],
  });

  canvas.root = root;

  elA = world.createUIElement({
    ...panelStyle,
    width: 500,
    height: 500,
  });

  elB = world.createUIElement({
    width: 400,
    height: 400,
    backgroundColor: [0, 1, 0, 0.41],
    borderColor: [1, 1, 1, 1],
    borderRadius: [128, 128, 128, 128],
  });

  button = world.createUIButton({
    label: "button label",
    value: "button pressed 0 times",
    width: 180,
    height: 180,
  });

  text = world.createUIText({
    value: "hello, world!",
    color: [1, 1, 1, 1],
  });

  elC = world.createUIElement({
    width: 250,
    height: 250,
    backgroundColor: [0, 0, 1, 1],
    borderColor: [1, 1, 1, 1],
  });

  elC.addChild(button);

  root.addChild(elA);
  root.addChild(elB);
  elB.addChild(elC);
  elA.addChild(text);

  world.environment.addNode(node);
};

let x = 0;
world.onupdate = (dt) => {
  if (button.pressed) {
    button.value = "button pressed " + ++x + " times";
    canvas.redraw();
  }
};
