let boxNode3;

onenter = () => {
  const scene = WebSG.getEnvironmentScene();
  const boxNode = WebSG.createNode();
  WebSG.nodeSetPosition(boxNode, new Float32Array([0, 10, 0]));
  WebSG.nodeSetMesh(
    boxNode,
    WebSG.createBoxMesh({
      size: new Float32Array([1, 1, 1]),
      segments: new Uint32Array([1, 1, 1]),
    })
  );
  WebSG.nodeSetCollider(
    boxNode,
    WebSG.createCollider({
      type: WebSG.ColliderType.Box,
      size: new Float32Array([1, 1, 1]),
    })
  );
  WebSG.addPhysicsBody(boxNode, {
    type: WebSG.PhysicsBodyType.Rigid,
  });
  WebSG.sceneAddNode(scene, boxNode);

  const boxNode2 = WebSG.createNode();
  const material = WebSG.createMaterial(WebSG.MaterialType.Standard);
  WebSG.materialSetBaseColorFactor(material, new Float32Array([1, 1, 1, 1]));
  // Currently needed to make sure the node with the default material renders correctly
  WebSG.nodeSetPosition(boxNode2, new Float32Array([2, 10, 0]));
  WebSG.nodeSetMesh(
    boxNode2,
    WebSG.createBoxMesh({
      size: new Float32Array([1, 1, 1]),
      segments: new Uint32Array([1, 1, 1]),
      material,
    })
  );
  WebSG.nodeSetCollider(
    boxNode2,
    WebSG.createCollider({
      type: WebSG.ColliderType.Box,
      size: new Float32Array([1, 1, 1]),
    })
  );
  WebSG.addPhysicsBody(boxNode2, {
    type: WebSG.PhysicsBodyType.Kinematic,
  });
  WebSG.sceneAddNode(scene, boxNode2);

  boxNode3 = WebSG.createNode();
  const material2 = WebSG.createMaterial(WebSG.MaterialType.Standard);
  WebSG.materialSetBaseColorFactor(material2, new Float32Array([1, 1, 1, 1]));
  WebSG.nodeSetPosition(boxNode3, new Float32Array([-2, 10, 0]));
  WebSG.nodeSetMesh(
    boxNode3,
    WebSG.createBoxMesh({
      size: new Float32Array([1, 1, 1]),
      segments: new Uint32Array([1, 1, 1]),
      material,
    })
  );
  WebSG.nodeSetCollider(
    boxNode3,
    WebSG.createCollider({
      type: WebSG.ColliderType.Box,
      size: new Float32Array([1, 1, 1]),
    })
  );
  WebSG.addPhysicsBody(boxNode3, {
    type: WebSG.PhysicsBodyType.Kinematic,
  });
  WebSG.sceneAddNode(scene, boxNode3);
};

let elapsed = 0;

const position = new Float32Array([-2, 10, 0]);

onupdate = (dt) => {
  elapsed += dt;

  if (boxNode3) {
    position[1] = Math.sin(elapsed) * 1 + 10;
    WebSG.nodeSetPosition(boxNode3, position);
  }
};
