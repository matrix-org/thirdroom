declare namespace WebSG {
  type AccessorType = "SCALAR" | "VEC2" | "VEC3" | "VEC4" | "MAT2" | "MAT3" | "MAT4";
  const AccessorType: { [Type in AccessorType]: Type };

  type AccessorComponentType = 5120 | 5121 | 5122 | 5123 | 5125 | 5126;
  const AccessorComponentType: {
    Int8: 5120;
    Uint8: 5121;
    Int16: 5122;
    Uint16: 5123;
    Uint32: 5125;
    Float32: 5126;
  };

  interface AccessorFromProps {
    type: AccessorType;
    componentType: AccessorComponentType;
    count: number;
    normalized?: boolean;
    dynamic?: boolean;
    min?: number[];
    max?: number[];
  }

  class Accessor {
    updateWith(data: ArrayBuffer): this;
  }

  type ColliderType = "box" | "sphere" | "capsule" | "cylinder" | "hull" | "trimesh";
  const ColliderType: {
    Box: "box";
    Sphere: "sphere";
    Capsule: "capsule";
    Cylinder: "cylinder";
    Hull: "hull";
    Trimesh: "trimesh";
  };

  interface ColliderProps {
    type: ColliderType;
    isTrigger?: boolean;
    size?: ArrayLike<number>;
    radius?: number;
    height?: number;
    mesh?: Mesh;
  }

  class Collider {}

  type InteractableProps = {};

  class Interactable {
    get pressed(): boolean;
    get held(): boolean;
    get released(): boolean;
  }

  type LightType = "directional" | "point" | "spot";
  const LightType: {
    Directional: "directional";
    Point: "point";
    Spot: "spot";
  };

  interface LightProps {
    type: LightType;
    name?: string;
    intensity?: number;
    color?: ArrayLike<number>;
    range?: number;
    innerConeAngle?: number;
    outerConeAngle?: number;
  }

  class Light {
    get intensity(): number;
    set intensity(value: number);
    readonly color: RGB;
  }

  type AlphaMode = "OPAQUE" | "BLEND" | "MASK";
  const AlphaMode: { [Mode in AlphaMode]: Mode };

  interface UnlitMaterialProps {
    name?: string;
    baseColorFactor?: ArrayLike<number>;
    baseColorTexture?: Texture;
    doubleSided?: boolean;
    alphaCutoff?: number;
    alphaMode?: AlphaMode;
  }

  interface MaterialProps {
    name?: string;
    doubleSided?: boolean;
    alphaCutoff?: number;
    alphaMode?: AlphaMode;
    baseColorFactor?: ArrayLike<number>;
    baseColorTexture?: Texture;
    metallicFactor?: number;
    roughnessFactor?: number;
    metallicRoughnessTexture?: Texture;
    normalTexture?: Texture;
    normalScale?: number;
    occlusionTexture?: Texture;
    occlusionStrength?: number;
    emissiveFactor?: ArrayLike<number>;
    emissiveTexture?: Texture;
  }

  class Material {
    readonly baseColorFactor: RGBA;
    get baseColorTexture(): Texture | undefined;
    set baseColorTexture(texture: Texture | undefined);
    get metallicFactor(): number;
    set metallicFactor(value: number);
    get roughnessFactor(): number;
    set roughnessFactor(value: number);
    readonly emissiveFactor: RGB;
  }

  class Matrix4 {
    [n: number]: number;
    set(value: ArrayLike<number>): undefined;
    readonly length: number;
  }

  class ReadonlyMatrix4 {
    readonly [n: number]: number;
    readonly length: number;
  }

  type MeshPrimitiveAttribute =
    | "POSITION"
    | "NORMAL"
    | "TANGENT"
    | "TEXCOORD_0"
    | "TEXCOORD_1"
    | "COLOR_0"
    | "JOINTS_0"
    | "WEIGHTS_0";
  const MeshPrimitiveAttribute: { [Attribute in MeshPrimitiveAttribute]: Attribute };

  type MeshPrimitiveMode = 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const MeshPrimitiveMode: {
    POINTS: 0;
    LINES: 1;
    LINE_LOOP: 2;
    LINE_STRIP: 3;
    TRIANGLES: 4;
    TRIANGLE_STRIP: 5;
    TRIANGLE_FAN: 6;
  };

  interface MeshPrimitiveProps {
    mode?: MeshPrimitiveMode;
    indices?: Accessor;
    material?: Material;
    attributes: { [name in MeshPrimitiveAttribute]?: Accessor };
  }

  class MeshPrimitive {
    get mode(): MeshPrimitiveMode;
    get indices(): Accessor | undefined;
    getAttribute(name: MeshPrimitiveAttribute): Accessor | undefined;
    get material(): Material | undefined;
    set material(material: Material | undefined);
    setDrawRange(start: number, count: number): this;
    thirdroomSetHologramMaterialEnabled(enabled: boolean): this;
  }

  interface MeshProps {
    name?: string;
    primitives: MeshPrimitiveProps[];
  }

  interface BoxMeshProps {
    size?: ArrayLike<number>;
    segments?: ArrayLike<number>;
    material?: Material;
  }

  class Mesh {
    readonly primitives: MeshPrimitive[];
  }

  class NodeIterator {
    next(): { value: Node; done: boolean };
    [Symbol.iterator](): NodeIterator;
  }

  interface NodeProps {
    name?: string;
    mesh?: Mesh;
    uiCanvas?: UICanvas;
    translation?: ArrayLike<number>;
    rotation?: ArrayLike<number>;
    scale?: ArrayLike<number>;
  }

  interface OrbitOptions {
    pitch?: number;
    yaw?: number;
    zoom?: number;
  }

  class Node {
    readonly translation: Vector3;
    readonly rotation: Quaternion;
    readonly scale: Vector3;
    readonly matrix: Matrix4;
    readonly worldMatrix: ReadonlyMatrix4;
    addChild(node: Node): this;
    removeChild(node: Node): this;
    getChild(index: number): Node | undefined;
    children(): NodeIterator;
    get parent(): Node | undefined;
    get isStatic(): boolean;
    set isStatic(value: boolean);
    get visible(): boolean;
    set visible(value: boolean);
    get mesh(): Mesh | undefined;
    set mesh(mesh: Mesh | undefined);
    get light(): Light | undefined;
    set light(light: Light | undefined);
    get collider(): Collider | undefined;
    set collider(collider: Collider | undefined);
    get uiCanvas(): UICanvas | undefined;
    set uiCanvas(uiCanvas: UICanvas | undefined);
    get interactable(): Interactable | undefined;
    addInteractable(props?: InteractableProps): Interactable;
    removeInteractable(): undefined;
    get physicsBody(): PhysicsBody | undefined;
    addPhysicsBody(props?: PhysicsBodyProps): PhysicsBody;
    removePhysicsBody(): undefined;
    startOrbit(options?: OrbitOptions): undefined;
  }

  type PhysicsBodyType = "kinematic" | "rigid" | "static";
  const PhysicsBodyType: {
    Kinematic: "kinematic";
    Rigid: "rigid";
    Static: "static";
  };

  interface PhysicsBodyProps {
    type: PhysicsBodyType;
    linearVelocity?: ArrayLike<number>;
    angularVelocity?: ArrayLike<number>;
    inertiaTensor?: ArrayLike<number>;
  }

  class PhysicsBody {}

  class Quaternion {
    [n: number]: number;
    x: number;
    y: number;
    z: number;
    w: number;
    set(value: ArrayLike<number>): undefined;
    readonly length: number;
  }

  class RGB {
    [n: number]: number;
    r: number;
    g: number;
    b: number;
    set(value: ArrayLike<number>): undefined;
    readonly length: number;
  }

  class RGBA {
    [n: number]: number;
    r: number;
    g: number;
    b: number;
    a: number;
    set(value: ArrayLike<number>): undefined;
    readonly length: number;
  }

  interface SceneProps {
    name?: string;
  }

  class Scene {
    addNode(node: Node): this;
    removeNode(node: Node): this;
    getNode(index: number): Node | undefined;
    nodes(): NodeIterator;
  }

  class Texture {}

  interface UIButtonProps extends UITextProps {
    label?: string;
  }

  class UIButton extends UIText {
    get label(): string;
    set label(value: string);
    get pressed(): boolean;
    get held(): boolean;
    get released(): boolean;
  }

  interface UICanvasProps {
    root?: UIElement;
    width?: number;
    height?: number;
    size?: ArrayLike<number>;
  }

  class UICanvas {
    get root(): UIElement;
    set root(element: UIElement);
    get width(): number;
    set width(value: number);
    get height(): number;
    set height(value: number);
    redraw(): undefined;
    readonly size: Vector2;
  }

  type ElementType = "flex" | "text" | "button";

  type FlexDirection = "column" | "column-reverse" | "row" | "row-reverse";

  type ElementPositionType = "relative" | "absolute";

  type FlexAlign =
    | "auto"
    | "flex-start"
    | "center"
    | "flex-end"
    | "stretch"
    | "baseline"
    | "space-between"
    | "space-around";

  type FlexJustify = "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";

  type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";

  interface UIElementProps {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    position?: ElementPositionType;
    alignContent?: FlexAlign;
    alignItems?: FlexAlign;
    alignSelf?: FlexAlign;
    flexDirection?: FlexDirection;
    flexWrap?: FlexWrap;
    flexBasis?: number;
    flexGrow?: number;
    flexShrink?: number;
    justifyContent?: FlexJustify;
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    backgroundColor?: ArrayLike<number>;
    borderColor?: ArrayLike<number>;
    padding?: ArrayLike<number>;
    margin?: ArrayLike<number>;
    borderWidth?: ArrayLike<number>;
    borderRadius?: ArrayLike<number>;
  }

  class UIElementIterator {
    next(): { value: UIElement; done: boolean };
    [Symbol.iterator](): UIElementIterator;
  }

  class UIElement {
    get position(): ElementPositionType;
    set position(value: ElementPositionType);
    get top(): number;
    set top(value: number);
    get right(): number;
    set right(value: number);
    get bottom(): number;
    set bottom(value: number);
    get left(): number;
    set left(value: number);
    get alignContent(): FlexAlign;
    set alignContent(value: FlexAlign);
    get alignItems(): FlexAlign;
    set alignItems(value: FlexAlign);
    get alignSelf(): FlexAlign;
    set alignSelf(value: FlexAlign);
    get flexDirection(): FlexDirection;
    set flexDirection(value: FlexDirection);
    get flexWrap(): FlexWrap;
    set flexWrap(value: FlexWrap);
    get flexBasis(): number;
    set flexBasis(value: number);
    get flexGrow(): number;
    set flexGrow(value: number);
    get flexShrink(): number;
    set flexShrink(value: number);
    get justifyContent(): FlexJustify;
    set justifyContent(value: FlexJustify);
    get width(): number;
    set width(value: number);
    get height(): number;
    set height(value: number);
    get minWidth(): number;
    set minWidth(value: number);
    get minHeight(): number;
    set minHeight(value: number);
    get maxWidth(): number;
    set maxWidth(value: number);
    get maxHeight(): number;
    set maxHeight(value: number);
    addChild(element: UIElement): this;
    removeChild(element: UIElement): this;
    getChild(index: number): UIElement | undefined;
    children(): UIElementIterator;
    get parent(): UIElement | undefined;
    get type(): ElementType;
    readonly backgroundColor: RGBA;
    readonly borderColor: RGBA;
    readonly padding: Vector4;
    readonly margin: Vector4;
    readonly borderWidth: Vector4;
    readonly borderRadius: Vector4;
  }

  interface UITextProps extends UIElementProps {
    value?: string;
    fontFamily?: string;
    fontStyle?: string;
    fontWeight?: string;
    color?: ArrayLike<number>;
    fontSize?: number;
  }

  class UIText extends UIElement {
    get value(): string;
    set value(value: string);
    get fontFamily(): string;
    set fontFamily(value: string);
    get fontWeight(): string;
    set fontWeight(value: string);
    get fontSize(): number;
    set fontSize(value: number);
    get fontStyle(): string;
    set fontStyle(value: string);
    readonly color: RGBA;
  }

  class Vector2 {
    [index: number]: number;
    x: number;
    y: number;
    set(value: ArrayLike<number>): undefined;
    readonly length: number;
  }

  class Vector3 {
    [index: number]: number;
    x: number;
    y: number;
    z: number;
    set(value: ArrayLike<number>): undefined;
    readonly length: number;
  }

  class Vector4 {
    [index: number]: number;
    x: number;
    y: number;
    z: number;
    w: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
    set(value: ArrayLike<number>): undefined;
    readonly length: number;
  }

  class World {
    get environment(): Scene;
    set environment(scene: Scene);
    createAccessorFrom(buffer: ArrayBuffer, props: AccessorFromProps): Accessor;
    findAccessorByName(name: string): Accessor | undefined;
    createCollider(props: ColliderProps): Collider;
    findColliderByName(name: string): Collider | undefined;
    createLight(props: LightProps): Light;
    findLightByName(name: string): Light | undefined;
    createUnlitMaterial(props: UnlitMaterialProps): Material;
    createMaterial(props: MaterialProps): Material;
    findMaterialByName(name: string): Material | undefined;
    createMesh(props: MeshProps): Mesh;
    createBoxMesh(props: BoxMeshProps): Mesh;
    findMeshByName(name: string): Mesh | undefined;
    createNode(props?: NodeProps): Node;
    findNodeByName(name: string): Node | undefined;
    createScene(props?: SceneProps): Scene;
    findSceneByName(name: string): Scene | undefined;
    findTextureByName(name: string): Texture | undefined;
    createUICanvas(props?: UICanvasProps): UICanvas;
    findUICanvasByName(name: string): UICanvas | undefined;
    createUIElement(props?: UIElementProps): UIElement;
    createUIText(props?: UITextProps): UIText;
    createUIButton(props?: UIButtonProps): UIButton;
    findUIElementByName(name: string): UIElement | undefined;
    stopOrbit(): undefined;
    onload: (() => any) | null;
    onenter: (() => any) | null;
    onupdate: ((dt: number, time: number) => any) | null;
  }
}

declare const world: WebSG.World;

interface WebSGNetworking {
  listen(): undefined;
  close(): undefined;
  broadcast(data: ArrayBuffer): undefined;
  receive(): ArrayBuffer | undefined;
  receiveInto(buffer: ArrayBuffer): number;
}

declare const network: WebSGNetworking;

interface ThirdRoom {
  enableMatrixMaterial(enabled: boolean): undefined;
  getAudioDataSize(): number;
  getAudioTimeData(data: Float32Array): number;
  getAudioFrequencyData(data: Float32Array): number;
  inAR(): boolean;
}

declare const thirdroom: ThirdRoom;

interface MatrixWidgetAPIRequest {
  api: "fromWidget" | "toWidget";
  requestId: string;
  action: string;
  widgetId: string;
  data: unknown;
}

interface MatrixWidgetAPIResponse extends MatrixWidgetAPIRequest {
  response: unknown;
}

interface MatrixWidgetAPIErrorResponse extends MatrixWidgetAPIResponse {
  response: {
    error: {
      message: string;
    };
  };
}

type MatrixAPIMessage = MatrixWidgetAPIRequest | MatrixWidgetAPIResponse | MatrixWidgetAPIErrorResponse;

interface MatrixWidgetAPI {
  listen(): undefined;
  close(): undefined;
  receive(): MatrixAPIMessage | undefined;
  send(event: MatrixAPIMessage): undefined;
}

declare const matrix: MatrixWidgetAPI;

interface Console {
  log(...data: any[]): void;
}

declare const console: Console;
