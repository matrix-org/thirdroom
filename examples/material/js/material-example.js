const defaultMaterial = WebSG.getMaterialByName("Default");
const groundMaterial = WebSG.getMaterialByName("Ground");
const glassMaterial = WebSG.getMaterialByName("Glass");

let elapsed = 0;

onupdate = (dt) => {
  elapsed += dt;
  defaultMaterial.baseColorFactor[1] = (Math.sin(elapsed) + 1) / 2;
  groundMaterial.baseColorFactor[0] = (Math.sin(elapsed) + 1) / 2;
  glassMaterial.baseColorFactor[3] = (Math.sin(elapsed) + 1) / 2;

  if (elapsed > 3 && groundMaterial.baseColorTexture) {
    groundMaterial.baseColorTexture = null;
  }
};
