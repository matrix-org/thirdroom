const directionalLight = WebSG.getLightByName("DirectionalLight");

let elapsed = 0;

onupdate = (dt) => {
  elapsed += dt;
  directionalLight.color[0] = (Math.sin(elapsed) + 1) / 2;
};
