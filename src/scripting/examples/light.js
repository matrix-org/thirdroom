const directionalLight = WebSG.getLightByName("DirectionalLight");
const pointLight = WebSG.getLightByName("PointLight");
const spotLight = WebSG.getLightByName("SpotLight");

let elapsed = 0;

const spotLightColors = [
  [1, 1, 1],
  [1, 1, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 1, 1],
  [0, 0, 1],
  [1, 0, 1],
];

onupdate = (dt) => {
  elapsed += dt;
  directionalLight.color[0] = (Math.sin(elapsed) + 1) / 2;
  pointLight.color[1] = (1 * (Math.cos(elapsed) + 1)) / 2;
  spotLight.color.set(spotLightColors[Math.round(elapsed % spotLightColors.length)]);
};
