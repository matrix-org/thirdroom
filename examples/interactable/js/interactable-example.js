const materialButton = WebSG.getNodeByName("MaterialButton");
materialButton.interactable = new WebSG.Interactable();
let materialState = false;
const leftCube = WebSG.getNodeByName("LeftCube");
const rightCube = WebSG.getNodeByName("RightCube");
const bricksTexture = WebSG.getTextureByName("Bricks");
const planksTexture = WebSG.getTextureByName("Planks");

const room1Switch = WebSG.getNodeByName("Room1Switch");
room1Switch.interactable = new WebSG.Interactable();
let room1LightState = true;
const room1Light = WebSG.getNodeByName("Room1Light");

const room2Switch = WebSG.getNodeByName("Room2Switch");
room2Switch.interactable = new WebSG.Interactable();
let room2LightState = true;
const room2Light = WebSG.getNodeByName("Room2Light");

onupdate = (dt) => {
  if (materialButton.interactable.pressed) {
    materialState = !materialState;

    for (const primitive of leftCube.mesh.primitives()) {
      primitive.material.baseColorTexture = materialState ? bricksTexture : planksTexture;
    }

    for (const primitive of rightCube.mesh.primitives()) {
      primitive.material.baseColorTexture = materialState ? planksTexture : bricksTexture;
    }
  }

  if (room1Switch.interactable.pressed) {
    room1LightState = !room1LightState;
    room1Light.light.intensity = room1LightState ? 20 : 0;
  }

  if (room2Switch.interactable.pressed) {
    room2LightState = !room2LightState;
    room2Light.light.intensity = room2LightState ? 20 : 0;
  }
};
