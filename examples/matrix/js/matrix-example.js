let tv;
let tvState = false;

onloadworld = () => {
  tv = world.findNodeByName("TV");
  tv.addInteractable();
};

onupdateworld = (dt) => {
  if (tv.interactable.pressed) {
    tvState = !tvState;
    thirdroom.enableMatrixMaterial(tvState);
  }
};
