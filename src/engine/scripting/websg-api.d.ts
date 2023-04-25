/* eslint-disable @typescript-eslint/no-empty-interface */

declare type Vector2 = [number, number] & { x: number; y: number };
declare type Vector3 = [number, number, number] & { x: number; y: number; z: number };
declare type Vector4 = [number, number, number, number] & { x: number; y: number; z: number; w: number };
declare type Matrix4 = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

/**
 * WebSG Documentation
 *
 * @see [Documentation](https://github.com/matrix-org/thirdroom/tree/main/docs)
 */
declare namespace WebSG {
  /**
   * Represents a 3D world where nodes, meshes, materials, colliders, and UI elements can be created and manipulated.
   *
   * @see [Documentation](https://github.com/matrix-org/thirdroom/tree/main/docs)
   */
  export interface World {
    environment: Scene;

    /**
     * Searches for a node by name and returns it if found, or undefined if not found.
     *
     * @param name The name of the node to search for.
     * @returns The found node or undefined if not found.
     */
    findNodeByName(name: string): Node | undefined;

    /**
     * Searches for a mesh by name and returns it if found, or undefined if not found.
     *
     * @param name The name of the mesh to search for.
     * @returns The found mesh or undefined if not found.
     */
    findMeshByName(name: string): Mesh | undefined;

    /**
     * Searches for a material by name and returns it if found, or undefined if not found.
     *
     * @param name The name of the material to search for.
     * @returns The found material or undefined if not found.
     */
    findMaterialByName(name: string): Material | undefined;

    /**
     * Creates a new node with the given properties.
     *
     * @param props An optional object containing properties to set on the node.
     * @returns The newly created node.
     */
    createNode(props?: NodeProps): Node;

    /**
     * Creates a new box mesh with the given properties.
     *
     * @param props An optional object containing properties to set on the box mesh.
     * @returns The newly created box mesh.
     */
    createBoxMesh(props?: BoxMeshProps): Mesh;

    /**
     * Creates a new collider with the given properties.
     *
     * @param props An object containing properties to set on the collider.
     * @returns The newly created collider.
     */
    createCollider(props: ColliderProps): Collider;

    /**
     * Creates a new UI canvas with the given properties.
     *
     * @param props An object containing properties to set on the UI canvas.
     * @returns The newly created UI canvas.
     */
    createUICanvas(props: UICanvasProps): UICanvas;

    /**
     * Creates a new UI element with the given properties.
     *
     * @param props An object containing properties to set on the UI element.
     * @returns The newly created UI element.
     */
    createUIElement(props: UIElementProps): UIElement;

    /**
     * Creates a new UI text element with the given properties.
     *
     * @param props An object containing properties to set on the UI text element.
     * @returns The newly created UI text element.
     */
    createUIText(props: UITextProps): UIText;

    /**
     * Creates a new UI button element with the given properties.
     *
     * @param props An object containing properties to set on the UI button element.
     * @returns The newly created UI button element.
     */
    createUIButton(props: UIButtonProps): UIButton;

    /**
     * Creates a new accessor from the given buffer and properties.
     *
     * @param buffer The buffer to create the accessor from.
     * @param props An object containing properties to set on the accessor.
     * @returns The newly created accessor.
     */
    createAccessorFrom(buffer: ArrayBuffer, props: AccessorProps): Accessor;

    /**
     * Creates a new mesh with the given primitive(s).
     *
     * @param primitives An array of mesh primitive properties to set on the mesh.
     * @returns The newly created mesh.
     */
    createMesh(primitives: MeshPrimitiveProps[]): Mesh;

    /**
     * Stops orbiting
     */
    stopOrbit(): void;
  }

  interface ExtensionItem<T> {
    name: string;
    extension: T;
  }

  interface Extensions {
    items: ExtensionItem[];
    count: number;
  }

  /**
   * A container that holds a collection of Nodes which define the objects in the 3D world.
   */
  export interface Scene {
    /**
     * Adds a Node to the Scene.
     *
     * @param node - The Node to be added.
     * @returns This Scene instance, for chaining.
     */
    addNode(node: Node): this;

    /**
     * Removes a Node from the Scene.
     *
     * @param node - The Node to be removed.
     * @returns This Scene instance, for chaining.
     */
    removeNode(node: Node): this;
  }

  export interface NodeProps {
    translation?: Vector3;
    rotation?: Vector4;
    scale?: Vector3;
    camera?: Camera;
    skin?: Skin;
    mesh?: Mesh;
  }

  /**
   * The `Node` represents a 3D scene graph and is an entity that can be transformed.
   *
   * @see [Documentation](https://github.com/matrix-org/thirdroom/tree/main/docs)
   */
  export interface Node {
    // scene graph
    addChild: (child: Node) => void;
    removeChild: (child: Node) => void;
    getChild: (index: number) => Node;
    children: () => Node[];
    parent: Node | Scene;

    // interaction
    interactable?: Interactable;
    addInteractable: () => void;
    removeInteractable: () => void;

    // physics
    physicsBody?: PhysicsBody;
    addPhysicsBody: (options: PhysicsBodyOptions) => void;
    removePhysicsBody: () => void;

    // 3D
    translation: Vector3;
    rotation: Vector4;
    scale: Vector3;
    matrix: {
      elements: Matrix4;
    };
    worldMatrix: {
      elements: readonly Matrix4;
    };
    isStatic: boolean;
    visible: boolean;

    mesh?: Mesh;
    light?: Light;
    collider?: Collider;
    uiCanvas?: UICanvas;
  }

  export interface Light {
    intensity: number;
  }

  export enum MeshPrimitiveMode {
    POINTS,
    LINES,
    LINE_LOOP,
    LINE_STRIP,
    TRIANGLES,
    TRIANGLE_STRIP,
    TRIANGLE_FAN,
  }

  export enum MeshPrimitiveAttribute {
    POSITION,
    NORMAL,
    TANGENT,
    TEXCOORD_0,
    TEXCOORD_1,
    COLOR_0,
    JOINTS_0,
    WEIGHTS_0,
  }

  export interface MeshPrimitiveAttributeItem {
    key: MeshPrimitiveAttribute;
    accessor: Accessor;
  }

  export interface MeshPrimitiveAttributesList {
    items: MeshPrimitiveAttributeItem[];
    count: number;
  }

  export interface MeshPrimitiveTarget {
    key: MeshPrimitiveAttribute;
    accessor: Accessor;
  }

  export interface MeshPrimitiveTargetsList {
    items: MeshPrimitiveTarget[];
    count: number;
  }

  export interface MeshPrimitiveProps {
    attributes: MeshPrimitiveAttributesList;
    indices: Accessor;
    material: Material;
    mode: MeshPrimitiveMode;
    targets: MeshPrimitiveTargetsList;
  }

  export interface MeshPrimitivePropsList {
    items: MeshPrimitiveProps[];
    count: number;
  }

  export interface MeshProps {
    name: string;
    weights: Float32Array;
    primitives: MeshPrimitivePropsList;
  }

  export interface BoxMeshProps {
    size: [number, number, number];
    segments: [number, number, number];
    material: Material;
  }

  // export interface BoxMeshProps {}
  // export interface MeshPrimitiveProps {}
  // export interface Mesh {
  //   thirdroomSetPrimitiveHologramMaterialEnabled(primitiveIndex: number, enabled: boolean): this;
  //   setPrimitiveDrawRange(index: number, start: number, end: number): this;
  // }

  /**
   * Accessor
   */
  export enum AccessorType {
    SCALAR,
    VEC2,
    VEC3,
    VEC4,
    MAT2,
    MAT3,
    MAT4,
  }

  export enum AccessorComponentType {
    Int8 = 5120,
    Uint8 = 5121,
    Int16 = 5122,
    Uint16 = 5123,
    Uint32 = 5125,
    Float32 = 5126,
  }

  export interface Accessor {
    type: AccessorType;
    componentType: AccessorComponentType;
    count: number;
    normalized: number;
    dynamic: number;
    min?: Float32Array;
    max?: Float32Array;
  }

  // export interface AccessorProps {}
  // export interface Accessor {
  //   updateWith(buffer: ArrayBuffer);
  // }

  /**
   * Physics
   */
  export interface ColliderProps {}

  export interface Collider {}

  export interface PhysicsBodyProps {}

  export interface PhysicsBody {}

  /**
   * Interactable
   */
  export interface Interactable {
    pressed: boolean;
    held: boolean;
    released: boolean;
    isPressed(): boolean;
  }

  /**
   * UI
   */
  enum ElementType {
    FLEX,
    TEXT,
    BUTTON,
    IMAGE,
  }

  enum FlexDirection {
    COLUMN,
    COLUMN_REVERSE,
    ROW,
    ROW_REVERSE,
  }

  enum ElementPositionType {
    STATIC,
    RELATIVE,
    ABSOLUTE,
  }

  enum FlexAlign {
    AUTO,
    FLEX_START,
    CENTER,
    FLEX_END,
    STRETCH,
    BASELINE,
    SPACE_BETWEEN,
    SPACE_AROUND,
  }

  enum FlexJustify {
    FLEX_START,
    CENTER,
    FLEX_END,
    SPACE_BETWEEN,
    SPACE_AROUND,
    SPACE_EVENLY,
  }

  enum FlexWrap {
    NO_WRAP,
    WRAP,
    WRAP_REVERSE,
  }

  export interface UICanvasBase {
    redraw(): void;
  }

  export interface UICanvasProps {
    root?: UIElement;
    size?: Vector2;
  }

  export interface UICanvas extends UICanvasBase, UICanvasProps {
    size: Vector2;
  }

  export interface UIElementBase {
    addChild(child: UIElementBase): this;
    setColor(color: Float32Array);
    setBorderColor(color: Float32Array);
  }

  export interface UIElementProps {
    backgroundColor?: RGBAColor;
    borderColor?: RGBAColor;
    padding?: Vector4;
    margin?: Vector4;
    borderWidth?: Vector4;
    borderRadius?: Vector4;
    position?: string;
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    alignContent?: string;
    alignItems?: string;
    alignSelf?: string;
    flexDirection?: string;
    flexWrap?: string;
    flexBasis?: number;
    flexGrow?: number;
    flexShrink?: number;
    justifyContent?: string;
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  }

  export interface UIElement extends UIElementBase, UIElementProps {
    parent: UIElement | null;
    type: string;
  }

  interface UIButtonProps {
    label: WebSGString;
  }

  export interface UIButton extends UIElement, UIButtonProps {}

  interface UITextProps {
    value: WebSGString;
    fontFamily: WebSGString;
    fontWeight: WebSGString;
    fontStyle: WebSGString;
    fontSize: number;
    color: Vector4;
  }

  export interface UIButton extends UIElementBase {
    isPressed(): boolean;
  }

  export interface UITextProps extends UIElementBaseProps {}

  export interface UIText extends UIElementBase {
    setValue(value: string): this;
  }

  /**
   * Material
   */
  export interface Material {
    getBaseColorTexture(): Texture | undefined;
    setBaseColorTexture(texture: Texture | undefined);
  }

  /**
   * Texture
   */
  export interface Texture {}

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

  export interface ThirdRoom {
    inAR(): boolean;
  }

  export interface OutboundMatrixEvent {}

  export interface InboundMatrixEvent {
    data: any;
  }

  export interface Matrix {
    listen(): void;
    // TODO
    send(event: OutboundMatrixEvent);
    receive(): InboundMatrixEvent;
  }

  export interface Network {
    listen(): void;
    close(): void;
    receive(receivingBuffer?: ArrayBuffer): ArrayBuffer;
    broadcast(buffer: ArrayBuffer): void;
  }
}

declare const world: WebSG.World;
declare const thirdroom: WebSG.ThirdRoom;
declare const matrix: WebSG.Matrix;
declare const network: WebSG.Network;

declare let onload: (() => void) | undefined;
declare let onenter: (() => void) | undefined;
declare let onupdate: ((dt: number, elapsed: number) => void) | undefined;
