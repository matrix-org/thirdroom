const tv = WebSG.getNodeByName("TV");
tv.interactable = new WebSG.Interactable();

let tvState = false;

onupdate = (dt) => {
  if (tv.interactable.pressed) {
    tvState = !tvState;
    thirdroom.enableMatrixMaterial(tvState);
  }
};
