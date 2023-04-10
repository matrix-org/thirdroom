let tv;
let tvState = false;

onload = () => {
  tv = world.findNodeByName("TV");
  tv.addInteractable();
};

onupdate = (dt) => {
  if (tv.interactable.pressed) {
    tvState = !tvState;
    thirdroom.enableMatrixMaterial(tvState);
  }
};
