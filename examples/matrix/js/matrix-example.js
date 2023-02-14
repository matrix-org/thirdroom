let tv;
let tvState = false;

onload = () => {
  tv = WebSG.nodeFindByName("TV");
  WebSG.addInteractable(tv);
};

onupdate = (dt) => {
  if (WebSG.getInteractablePressed(tv)) {
    tvState = !tvState;
    ThirdRoom.enableMatrixMaterial(tvState);
  }
};
