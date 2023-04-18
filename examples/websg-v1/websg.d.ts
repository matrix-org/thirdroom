interface WebSGWorld {
  getEnvironmentScene(): WebSGScene;
  findNodeByName(name: string): WebSGNode | undefined;
  findMeshByName(name: string): WebSGMesh | undefined;
  findMaterialByName(name: string): WebSGMaterial | undefined;
  createNode(props?: WebSGNodeProps): WebSGNode;
  createBoxMesh(props?: WebSGBoxMeshProps): WebSGMesh;
  createCollider(props: WebSGColliderProps): WebSGCollider;
  createUICanvas(props: WebSGUICanvasProps): WebSGUICanvas;
  createUIFlex(props: WebSGUIFlexProps): WebSGUIFlex;
  createUIText(props: WebSGUITextProps): WebSGUIText;
  createUIButton(props: WebSGUIButtonProps): WebSGUIButton;
  createAccessorFrom(buffer: ArrayBuffer, props: WebSGAccessorProps): WebSGAccessor;
  createMesh(primitives: WebSGMeshPrimitiveProps[]): WebSGMesh;
}

interface WebSGScene {
  addNode(node: WebSGNode): this;
  removeNode(node: WebSGNode): this;
}

interface WebSGNodeProps {}

interface WebSGNode {
  getPosition(target: Float32Array): Float32Array;
  setPosition(target: Float32Array): this;
  getQuaternion(target: Float32Array): Float32Array;
  setQuaternion(value: Float32Array): this;
  setIsStatic(value: boolean, recursive?: boolean): this;
  getIsStatic(): boolean;
  setVisible(value: boolean): this;
  getVisible(): boolean;
  getMesh(): WebSGMesh | undefined;
  setMesh(mesh: WebSGMesh | undefined): this;
  setUICanvas(uiCanvas: WebSGUICanvas | undefined): this;
  getUICanvas(): WebSGMesh | undefined;
  addInteractable(): WebSGInteractable;
  getInteractable(): WebSGInteractable | undefined;
  addCollider(collider: WebSGCollider): WebSGCollider;
  getCollider(): WebSGCollider | undefined;
  addPhysicsBody(props: WebSGPhysicsBodyProps): WebSGPhysicsBody;
}

interface WebSGBoxMeshProps {}

interface WebSGMeshPrimitiveProps {}

interface WebSGMesh {
  thirdroomSetPrimitiveHologramMaterialEnabled(primitiveIndex: number, enabled: boolean): this;
  setPrimitiveDrawRange(index: number, start: number, end: number): this;
}

interface WebSGAccessorProps {}

interface WebSGAccessor {
  updateWith(buffer: ArrayBuffer);
}

interface WebSGColliderProps {}

interface WebSGCollider {}

interface WebSGPhysicsBodyProps {}

interface WebSGPhysicsBody {}

interface WebSGInteractable {
  isPressed(): boolean;
}

interface WebSGUICanvasProps {}

interface WebSGUICanvas {
  setRoot(root: WebSGUIFlexBase): this;
  redraw(): void;
}

interface WebSGUIFlexBaseProps {}

interface WebSGUIFlexBase {
  addChild(child: WebSGUIFlexBase): this;
  setColor(color: Float32Array);
  setBorderColor(color: Float32Array);
}

interface WebSGUIFlexProps extends WebSGUIFlexBaseProps {}

interface WebSGUIFlex extends WebSGUIFlexBase {}

interface WebSGUIButtonProps extends WebSGUIFlexBaseProps {}

interface WebSGUIButton extends WebSGUIFlexBase {
  isPressed(): boolean;
}

interface WebSGUITextProps extends WebSGUIFlexBaseProps {}

interface WebSGUIText extends WebSGUIFlexBase {
  setValue(value: string): this;
}

interface WebSGMaterial {
  getBaseColorTexture(): WebSGTexture | undefined;
  setBaseColorTexture(texture: WebSGTexture | undefined);
}

interface WebSGTexture {}

declare namespace WebSG {
  const ColliderType: {
    Box: "box";
  };

  const PhysicsBodyType: {
    Kinematic: "kinematic";
  };

  const AccessorType: {
    VEC3: "VEC3";
  };

  const AccessorComponentType: {
    Float32: number;
  };

  const MeshPrimitiveMode: {
    LINE_STRIP: number;
  };

  const MeshPrimitiveAttribute: {
    POSITION: "POSITION";
  };
}

declare const world: WebSGWorld;
declare let onenter: (() => void) | undefined;
declare let onupdate: ((dt: number, time: number) => void) | undefined;

interface ThirdRoom {
  inAR(): boolean;
}

declare const thirdroom: ThirdRoom;

interface OutboundMatrixEvent {}

interface InboundMatrixEvent {
  data: any;
}

interface Matrix {
  listen(): void;
  // TODO
  send(event: OutboundMatrixEvent);
  receive(): InboundMatrixEvent;
}

declare const matrix: Matrix;
