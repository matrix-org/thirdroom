let materialState = true;
let materialButton;
let leftCubeMaterial;
let rightCubeMaterial;
let bricksTexture;
let planksTexture;

let room1Light;
let room1Switch;
let room1LightState = true;

let room2Light;
let room2Switch;
let room2LightState = true;

world.onload = () => {
  materialButton = world.findNodeByName("MaterialButton");
  materialButton.addInteractable();

  leftCubeMaterial = world.findNodeByName("LeftCube").mesh.primitives[0].material;
  bricksTexture = leftCubeMaterial.baseColorTexture;

  rightCubeMaterial = world.findNodeByName("RightCube").mesh.primitives[0].material;
  planksTexture = rightCubeMaterial.baseColorTexture;

  room1Switch = world.findNodeByName("Room1Switch");
  room1Switch.addInteractable();

  const room1LightNode = world.findNodeByName("Room1Light");
  room1Light = room1LightNode.light;

  room2Switch = world.findNodeByName("Room2Switch");
  room2Switch.addInteractable();

  const room2LightNode = world.findNodeByName("Room2Light");
  room2Light = room2LightNode.light;
};

world.onupdate = (dt) => {
  if (materialButton.interactable.pressed) {
    materialState = !materialState;
    leftCubeMaterial.baseColorTexture = materialState ? bricksTexture : planksTexture;
    rightCubeMaterial.baseColorTexture = materialState ? planksTexture : bricksTexture;
  }

  if (room1Switch.interactable.pressed) {
    room1LightState = !room1LightState;
    room1Light.intensity = room1LightState ? 20 : 0;
  }

  if (room2Switch.interactable.pressed) {
    room2LightState = !room2LightState;
    room2Light.intensity = room2LightState ? 20 : 0;
  }
};
