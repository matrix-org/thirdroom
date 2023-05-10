thirdroom.actionBar.setItems([
  {
    id: "basketball",
    label: "Basketball",
    thumbnail: world.findImageByName("basketball-thumbnail"),
  },
]);

const actionBarListener = thirdroom.actionBar.createListener();

for (const actionId of actionBarListener.actions()) {
  if (actionId === "basketball") {
  }
}
