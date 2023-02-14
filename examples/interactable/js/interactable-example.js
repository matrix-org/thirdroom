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

onload = () => {
  materialButton = WebSG.nodeFindByName("MaterialButton");
  WebSG.addInteractable(materialButton);

  leftCubeMaterial = WebSG.materialFindByName("Bricks");
  bricksTexture = WebSG.materialGetBaseColorTexture(leftCubeMaterial);
  rightCubeMaterial = WebSG.materialFindByName("Planks");
  planksTexture = WebSG.materialGetBaseColorTexture(rightCubeMaterial);

  room1Switch = WebSG.nodeFindByName("Room1Switch");
  WebSG.addInteractable(room1Switch);

  const room1LightNode = WebSG.nodeFindByName("Room1Light");
  WebSG.nodeSetIsStatic(room1LightNode, false);
  room1Light = WebSG.nodeGetLight(room1LightNode);

  room2Switch = WebSG.nodeFindByName("Room2Switch");
  WebSG.addInteractable(room2Switch);

  const room2LightNode = WebSG.nodeFindByName("Room2Light");
  WebSG.nodeSetIsStatic(room2LightNode, false);
  room2Light = WebSG.nodeGetLight(room2LightNode);
};

onupdate = (dt) => {
  if (WebSG.getInteractablePressed(materialButton)) {
    materialState = !materialState;
    WebSG.materialSetBaseColorTexture(leftCubeMaterial, materialState ? bricksTexture : planksTexture);
    WebSG.materialSetBaseColorTexture(rightCubeMaterial, materialState ? planksTexture : bricksTexture);
  }

  if (WebSG.getInteractablePressed(room1Switch)) {
    room1LightState = !room1LightState;
    WebSG.lightSetIntensity(room1Light, room1LightState ? 20 : 0);
  }

  if (WebSG.getInteractablePressed(room2Switch)) {
    room2LightState = !room2LightState;
    WebSG.lightSetIntensity(room2Light, room2LightState ? 20 : 0);
  }
};
