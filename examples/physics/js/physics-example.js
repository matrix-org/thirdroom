world.onenter = () => {
  const scene = world.environment;

  for (let i = 0; i < 3; i++) {
    const boxNode = world.createNode({
      translation: [5, 2 + i, 0],
      mesh: world.createBoxMesh({
        size: [1, 1, 1],
        segments: [1, 1, 1],
      }),
      collider: world.createCollider({
        type: "box",
        size: [1, 1, 1],
      }),
    });
    boxNode.addPhysicsBody({ type: WebSG.PhysicsBodyType.Rigid });
    boxNode.addInteractable({ type: WebSG.InteractableType.Grabbable });

    scene.addNode(boxNode);
  }

  const boxNode2 = world.createNode({
    translation: [2, 2, 0],
    mesh: world.createBoxMesh({
      size: [1, 1, 1],
      segments: [1, 1, 1],
      material: world.createMaterial({
        baseColorFactor: [1, 1, 1, 1],
      }),
    }),
    collider: world.createCollider({ type: "box", size: [1, 1, 1] }),
  });
  boxNode2.addPhysicsBody({ type: WebSG.PhysicsBodyType.Kinematic });
  boxNode2.addInteractable();
  scene.addNode(boxNode2);

  const boxNode3 = world.createNode({
    translation: [-2, 2, 0],
    mesh: world.createBoxMesh({
      size: [1, 1, 1],
      segments: [1, 1, 1],
      material: world.createMaterial({
        baseColorFactor: [1, 1, 1, 1],
        metallicFactor: 0.5,
        roughnessFactor: 0.7,
      }),
    }),
    collider: world.createCollider({ type: "box", size: [1, 1, 1] }),
  });
  boxNode3.addPhysicsBody({ type: WebSG.PhysicsBodyType.Kinematic });
  boxNode3.addInteractable({ type: WebSG.InteractableType.Interactable });

  scene.addNode(boxNode3);

  world.onupdate = (dt, elapsed) => {
    boxNode3.translation[1] = Math.sin(elapsed) * 1 + 2;
    if (boxNode3.interactable.pressed) {
      boxNode3.startOrbit();
    }
  };
};
