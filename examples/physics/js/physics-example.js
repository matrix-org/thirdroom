let boxNode3;

onenterworld = () => {
  const scene = world.environment;

  for (let i = 0; i < 3; i++) {
    const boxNode = world.createNode({
      translation: [5, 1 + i, 0],
      mesh: world.createBoxMesh({
        size: [1, 1, 1],
        segments: [1, 1, 1],
      }),
    });
    boxNode.collider = world.createCollider({
      type: "box",
      size: [1, 1, 1],
    });
    boxNode.addPhysicsBody({ type: WebSG.PhysicsBodyType.Rigid });

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
  });
  boxNode2.collider = world.createCollider({ type: "box", size: [1, 1, 1] });
  boxNode2.addPhysicsBody({ type: WebSG.PhysicsBodyType.Kinematic });
  scene.addNode(boxNode2);

  boxNode3 = world.createNode({
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
  });
  boxNode3.collider = world.createCollider({ type: "box", size: [1, 1, 1] });
  boxNode3.addPhysicsBody({ type: WebSG.PhysicsBodyType.Kinematic });
  scene.addNode(boxNode3);
};

const translation = new Float32Array([-2, 2, 0]);

onupdateworld = (dt, elapsed) => {
  if (boxNode3) boxNode3.translation[1] = Math.sin(elapsed) * 1 + 2;
};
