world.onload = () => {
  const canvasNode = world.createNode({
    translation: [0, 2, 0],
    uiCanvas: world.createUICanvas({
      width: 1024,
      height: 1024,
      size: [1, 1],
      root: world.createUIElement({
        width: 1024,
        height: 1024,
        backgroundColor: [0, 0, 0, 0.5],
        alignItems: "flex-start",
      }),
    }),
  });

  canvasNode.uiCanvas.root.addChild(
    world.createUIText({
      padding: [6, 6, 6, 6],
      value: "Test",
      backgroundColor: [1, 1, 1, 1],
    })
  );

  canvasNode.uiCanvas.root.addChild(
    world.createUIButton({
      value: "Test Button",
    })
  );

  world.environment.addNode(canvasNode);
};
