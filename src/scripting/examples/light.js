const directionalLight = WebSG.getLightByName("DirectionalLight");
const pointLight = WebSG.getLightByName("PointLight");
const spotLight = WebSG.getLightByName("SpotLight");

onupdate = (dt) => {
  directionalLight.color[0] = Math.sin(dt);
  pointLight.color[1] = Math.sin(dt);
  spotLight.color[2] = Math.sin(dt);
};
