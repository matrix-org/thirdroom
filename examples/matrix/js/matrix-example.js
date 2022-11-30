const WHITE = [1, 1, 1, 1];
const BLACK = [0, 0, 0, 1];

const tv = WebSG.getNodeByName("TV");
tv.interactable = new WebSG.Interactable();

const tvScreenMaterial = WebSG.getMaterialByName("TVScreen");
const tvScreenTexture = tvScreenMaterial.baseColorTexture;
tvScreenMaterial.baseColorTexture = undefined;
tvScreenMaterial.baseColorFactor.set(WHITE);

let tvState = false;

onupdate = (dt) => {
  if (tv.interactable.pressed) {
    tvState = !tvState;
    tvScreenMaterial.baseColorTexture = tvState ? tvScreenTexture : undefined;
    tvScreenMaterial.baseColorFactor.set(tvState ? WHITE : BLACK);
  }
};
