onenter = () => {
  const boxNode = WebSG.createNode();
  //WebSG.nodeSetPosition(boxNode, new Float32Array([0, 5, 0]));
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
};
