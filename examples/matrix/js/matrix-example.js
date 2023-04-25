let tv;
let tvState = false;

world.onload = () => {
  tv = world.findNodeByName("TV");
  tv.addInteractable();
};

world.onupdate = (dt) => {
  if (tv.interactable.pressed) {
    tvState = !tvState;
    thirdroom.enableMatrixMaterial(tvState);
  }
};
