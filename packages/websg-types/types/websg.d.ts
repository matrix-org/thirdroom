/**
 * @namespace WebSG
 */
declare namespace WebSG {
  /**
   * @typedef AccessorType
   * @type {("SCALAR"|"VEC2"|"VEC3"|"VEC4"|"MAT2"|"MAT3"|"MAT4")}
   * @description The type of an accessor, describing the shape of the data it represents.
   */
  type AccessorType = "SCALAR" | "VEC2" | "VEC3" | "VEC4" | "MAT2" | "MAT3" | "MAT4";
  const AccessorType: { [Type in AccessorType]: Type };

  /**
   * @typedef AccessorComponentType
   * @type {(5120|5121|5122|5123|5125|5126)}
   * @description The component type of an accessor, describing the data type of individual components in the data.
   */
  type AccessorComponentType = 5120 | 5121 | 5122 | 5123 | 5125 | 5126;

  /**
   * @constant AccessorComponentType
   * @type {{
   *   Int8: 5120;
   *   Uint8: 5121;
   *   Int16: 5122;
   *   Uint16: 5123;
   *   Uint32: 5125;
   *   Float32: 5126;
   * }}
   * @description A mapping of AccessorComponentType values to their respective numeric codes.
   */
  const AccessorComponentType: {
    Int8: 5120;
    Uint8: 5121;
    Int16: 5122;
    Uint16: 5123;
    Uint32: 5125;
    Float32: 5126;
  };

  /**
   * @typedef AccessorFromProps
   * @type {Object}
   * @property {AccessorType} type - The shape of the data the accessor represents.
   * @property {AccessorComponentType} componentType - The data type of individual components in the data.
   * @property {number} count - The number of elements in the accessor.
   * @property {boolean} [normalized] - Whether the data should be normalized when accessed (default is `false`).
   * @property {boolean} [dynamic] - Whether the accessor's data is dynamic and can change over time (default is `false`).
   * @property {number[]} [min] - The minimum values of the accessor's components (optional).
   * @property {number[]} [max] - The maximum values of the accessor's components (optional).
   */
  interface AccessorFromProps {
    type: AccessorType;
    componentType: AccessorComponentType;
    count: number;
    normalized?: boolean;
    dynamic?: boolean;
    min?: number[];
    max?: number[];
  }

  /**
   * The Accessor class provides a way to update a given ArrayBuffer
   * with new data.
   */
  class Accessor {
    /**
     * Updates the existing ArrayBuffer with new data.
     *
     * @param {ArrayBuffer} data - The new data to update the ArrayBuffer.
     * @returns {Accessor} Returns the current Accessor instance to allow
     *                     method chaining.
     *
     * @example
     * // Create an instance of Accessor
     * const accessor = world.createAccessorFrom(buffer, {
     *  componentType: WebSG.AccessorComponentType.Uint16,
     *  count: indicesCount,
     *  type: WebSG.AccessorType.SCALAR,
     * });
     *
     * // Update the ArrayBuffer with new data
     * accessor.updateWith(newData);
     */
    updateWith(data: ArrayBuffer): this;
  }

  /**
   * A type representing the possible collider types in the physics system.
   * @typedef {("box" | "sphere" | "capsule" | "cylinder" | "hull" | "trimesh")} ColliderType
   */
  type ColliderType = "box" | "sphere" | "capsule" | "cylinder" | "hull" | "trimesh";

  /**
   * A constant object containing the possible collider types as keys and their corresponding string values.
   * @type {{Box: "box", Sphere: "sphere", Capsule: "capsule", Cylinder: "cylinder", Hull: "hull", Trimesh: "trimesh"}}
   */
  const ColliderType: {
    Box: "box";
    Sphere: "sphere";
    Capsule: "capsule";
    Cylinder: "cylinder";
    Hull: "hull";
    Trimesh: "trimesh";
  };

  /**
   * Collider properties interface.
   * @typedef {Object} ColliderProps
   * @property {ColliderType} type - The type of the Collider.
   * @property {boolean} [isTrigger=false] - Determines if the Collider acts as a trigger.
   * @property {ArrayLike<number>} [size] - The size of the Collider (required for box type).
   * @property {number} [radius] - The radius of the Collider (required for sphere, capsule, and cylinder types).
   * @property {number} [height] - The height of the Collider (required for capsule and cylinder types).
   * @property {Mesh} [mesh] - The mesh representing the shape of the Collider (required for hull and trimesh types).
   */
  interface ColliderProps {
    type: ColliderType;
    isTrigger?: boolean;
    size?: ArrayLike<number>;
    radius?: number;
    height?: number;
    mesh?: Mesh;
  }

  /**
   * The Collider class represents a shape that can be used for
   * collision detection in a physics simulation.
   */
  class Collider {
    /**
     * Creates a new Collider instance with the specified properties.
     *
     * @param {ColliderProps} props - The properties of the Collider.
     *
     * @example
     * // Create a new box Collider
     * const collider = world.createCollider({
     *   type: ColliderType.Box,
     *   size: [1, 1, 1],
     * });
     */
    constructor(props: ColliderProps);
  }

  type InteractableType = 1 | 2;
  const InteractableType: {
    Interactable: 1;
    Grabbable: 2;
  };

  type InteractableProps = {
    type: InteractableType;
  };

  /**
   * The Interactable class represents an object that can be interacted
   * with, providing information about its current interaction state.
   */
  class Interactable {
    /**
     * Returns the pressed state of the Interactable object.
     * @readonly
     * @type {boolean}
     * @returns {boolean} - True if the Interactable object is currently pressed, otherwise false.
     *
     * @example
     * node.addInteractable();
     * console.log(node.interactable.pressed); // false
     */
    get pressed(): boolean;

    /**
     * Returns the held state of the Interactable object.
     * @readonly
     * @type {boolean}
     * @returns {boolean} - True if the Interactable object is currently held, otherwise false.
     *
     * @example
     * node.addInteractable();
     * console.log(node.interactable.held); // false
     */
    get held(): boolean;

    /**
     * Returns the released state of the Interactable object.
     * @readonly
     * @type {boolean}
     * @returns {boolean} - True if the Interactable object has been recently released, otherwise false.
     *
     * @example
     * node.addInteractable();
     * console.log(node.interactable.released); // false
     */
    get released(): boolean;
  }

  /**
   * LightType is a union type representing the available types of lights.
   * @typedef {"directional" | "point" | "spot"} LightType
   */

  /**
   * LightType is an object containing the string constants for the available types of lights.
   * @type {Object} LightType
   * @property {string} Directional - Represents a directional light.
   * @property {string} Point - Represents a point light.
   * @property {string} Spot - Represents a spot light.
   */
  type LightType = {
    Directional: "directional";
    Point: "point";
    Spot: "spot";
  };

  /**
   * LightProps is an interface that defines the properties for creating a Light instance.
   * @interface LightProps
   * @property {LightType} type - The type of the light.
   * @property {string} [name] - The optional name of the light.
   * @property {number} [intensity] - The optional intensity of the light. Default is 1.
   * @property {ArrayLike<number>} [color] - The optional RGB color of the light. Default is white.
   * @property {number} [range] - The optional range of the light, for point and spot lights.
   * @property {number} [innerConeAngle] - The optional inner cone angle of the light, for spot lights.
   * @property {number} [outerConeAngle] - The optional outer cone angle of the light, for spot lights.
   */
  interface LightProps {
    type: LightType;
    name?: string;
    intensity?: number;
    color?: ArrayLike<number>;
    range?: number;
    innerConeAngle?: number;
    outerConeAngle?: number;
  }

  /**
   * The Light class represents a light source in a scene.
   */
  class Light {
    /**
     * Creates a new Light instance.
     * @param {LightProps} props - The properties to create the light with.
     */
    constructor(props: LightProps);

    /**
     * Returns the intensity of the Light object.
     * @readonly
     * @type {number}
     * @returns {number} - The intensity of the Light object.
     *
     * @example
     * const light = world.createLight({ type: LightType.Point });
     * console.log(light.intensity); // 1
     */
    get intensity(): number;

    /**
     * Sets the intensity of the Light object.
     * @param {number} value - The new intensity value for the Light object.
     *
     * @example
     * const light = world.createLight({ type: LightType.Point });
     * light.intensity = 2;
     * console.log(light.intensity); // 2
     */
    set intensity(value: number);

    /**
     * Returns the color of the Light object as an RGB instance.
     * @readonly
     * @type {RGB}
     * @returns {RGB} - The color of the Light object.
     *
     * @example
     * const light = world.createLight({ type: LightType.Point, color: [1, 0, 0] });
     * console.log(light.color); // RGB { r: 1, g: 0, b: 0 }
     */
    get color(): RGB;
  }

  /**
   * AlphaMode is a union type representing the available alpha modes.
   * @typedef {"OPAQUE" | "BLEND" | "MASK"} AlphaMode
   */
  type AlphaMode = "OPAQUE" | "BLEND" | "MASK";

  /**
   * AlphaMode is an object containing the string constants for the available alpha modes.
   * @const {Object.<AlphaMode, AlphaMode>} AlphaMode
   */
  const AlphaMode: { [Mode in AlphaMode]: Mode };

  /**
   * UnlitMaterialProps is an interface that defines the properties for creating an unlit Material instance.
   * @interface UnlitMaterialProps
   * @property {string} [name] - The optional name of the material.
   * @property {ArrayLike<number>} [baseColorFactor] - The optional RGBA base color factor.
   * @property {Texture} [baseColorTexture] - The optional base color texture.
   * @property {boolean} [doubleSided] - Whether the material is visible from both sides. Default is false.
   * @property {number} [alphaCutoff] - The optional alpha cutoff value for the material. Default is 0.5.
   * @property {AlphaMode} [alphaMode] - The optional alpha mode for the material. Default is 'OPAQUE'.
   */
  interface UnlitMaterialProps {
    name?: string;
    baseColorFactor?: ArrayLike<number>;
    baseColorTexture?: Texture;
    doubleSided?: boolean;
    alphaCutoff?: number;
    alphaMode?: AlphaMode;
  }

  /**
   * MaterialProps is an interface that defines the properties for creating a Material instance.
   * @interface MaterialProps
   * @property {string} [name] - The optional name of the material.
   * @property {boolean} [doubleSided] - Whether the material is visible from both sides. Default is false.
   * @property {number} [alphaCutoff] - The optional alpha cutoff value for the material. Default is 0.5.
   * @property {AlphaMode} [alphaMode] - The optional alpha mode for the material. Default is 'OPAQUE'.
   * @property {ArrayLike<number>} [baseColorFactor] - The optional RGBA base color factor.
   * @property {Texture} [baseColorTexture] - The optional base color texture.
   * @property {number} [metallicFactor] - The optional metallic factor. Default is 1.
   * @property {number} [roughnessFactor] - The optional roughness factor. Default is 1.
   * @property {Texture} [metallicRoughnessTexture] - The optional metallic-roughness texture.
   * @property {Texture} [normalTexture] - The optional normal texture.
   * @property {number} [normalScale] - The optional scale for the normal texture. Default is 1.
   * @property {Texture} [occlusionTexture] - The optional occlusion texture.
   * @property {number} [occlusionStrength] - The optional occlusion strength. Default is 1.
   * @property {ArrayLike<number>} [emissiveFactor] - The optional RGB emissive factor.
   * @property {Texture} [emissiveTexture] - The optional emissive texture.
   */
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

  /**
   * The Material class represents a material in a scene.
   */
  class Material {
    /**
     * Creates a new Material instance.
     * @param {MaterialProps} props - The properties to create the material with.
     */
    constructor(props: MaterialProps);

    /**
     * Returns the base color factor of the Material object as an RGBA instance.
     * @readonly
     * @type {RGBA}
     * @returns {RGBA} - The base color factor of the Material object.
     */
    get baseColorFactor(): RGBA;

    /**
     * Gets the base color texture of the Material object.
     * @type {Texture | undefined}
     * @returns {Texture | undefined} - The base color texture of the Material object.
     */
    get baseColorTexture(): Texture | undefined;

    /**
     * Sets the base color texture of the Material object.
     * @param {Texture | undefined} texture - The new base color texture.
     */
    set baseColorTexture(texture: Texture | undefined);

    /**
     * Gets the metallic factor of the Material object.
     * @type {number}
     * @returns {number} - The metallic factor of the Material object.
     */
    get metallicFactor(): number;

    /**
     * Sets the metallic factor of the Material object.
     * @param {number} value - The new metallic factor value.
     */
    set metallicFactor(value: number);

    /**
     * Gets the roughness factor of the Material object.
     * @type {number}
     * @returns {number} - The roughness factor of the Material object.
     */
    get roughnessFactor(): number;

    /**
     * Sets the roughness factor of the Material object.
     * @param {number} value - The new roughness factor value.
     */
    set roughnessFactor(value: number);

    /**
     * Returns the emissive factor of the Material object as an RGB instance.
     * @readonly
     * @type {RGB}
     * @returns {RGB} - The emissive factor of the Material object.
     */
    get emissiveFactor(): RGB;
  }

  /**
   * The Matrix4 class represents a 4x4 matrix of numbers.
   */
  class Matrix4 {
    /**
     * Gets or sets a number at a specific index.
     * @type {number}
     * @param {number} n - The index to access.
     * @returns {number} - The value at the given index.
     */
    [n: number]: number;

    /**
     * Sets the values of the Matrix4 instance.
     * @param {ArrayLike<number>} value - The new values for the Matrix4 instance.
     * @returns {undefined}
     */
    set(value: ArrayLike<number>): this;

    /**
     * Returns the length of the Matrix4 instance.
     */
    readonly length: number;
  }

  /**
   * The ReadonlyMatrix4 class represents a readonly 4x4 matrix of numbers.
   */
  class ReadonlyMatrix4 {
    /**
     * Gets the readonly value at a specific index.
     */
    readonly [n: number]: number;

    /**
     * Returns the length of the ReadonlyMatrix4 instance.
     */
    readonly length: number;
  }

  /**
   * Enumeration of possible mesh primitive attributes.
   */
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

  /**
   * Enumeration of possible mesh primitive rendering modes.
   */
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

  /**
   * MeshPrimitiveProps is an interface for defining properties of a mesh primitive.
   */
  interface MeshPrimitiveProps {
    mode?: MeshPrimitiveMode;
    indices?: Accessor;
    material?: Material;
    attributes: { [name in MeshPrimitiveAttribute]?: Accessor };
  }

  /**
   * The MeshPrimitive class represents a single primitive of a mesh.
   */
  class MeshPrimitive {
    /**
     * Returns the current rendering mode of the mesh primitive.
     * @type {MeshPrimitiveMode}
     */
    get mode(): MeshPrimitiveMode;

    /**
     * Returns the Accessor for the indices of the mesh primitive.
     * @type {Accessor | undefined}
     */
    get indices(): Accessor | undefined;

    /**
     * Returns the Accessor for the specified attribute name.
     * @param {MeshPrimitiveAttribute} name - The attribute name.
     * @returns {Accessor | undefined} - The Accessor for the attribute or undefined if not found.
     */
    getAttribute(name: MeshPrimitiveAttribute): Accessor | undefined;

    /**
     * Returns the Material of the mesh primitive.
     * @type {Material | undefined}
     */
    get material(): Material | undefined;

    /**
     * Sets the Material for the mesh primitive.
     * @param {Material | undefined} material - The Material to set.
     */
    set material(material: Material | undefined);

    /**
     * Sets the draw range for the mesh primitive.
     * @param {number} start - The starting index for the draw range.
     * @param {number} count - The number of indices in the draw range.
     * @returns {this} - The MeshPrimitive instance.
     */
    setDrawRange(start: number, count: number): this;

    /**
     * Enables or disables the hologram material for the mesh primitive.
     * @param {boolean} enabled - Whether to enable or disable the hologram material.
     * @returns {this} - The MeshPrimitive instance.
     */
    thirdroomSetHologramMaterialEnabled(enabled: boolean): this;
  }

  /**
   * MeshProps is an interface for defining properties of a mesh.
   */
  interface MeshProps {
    name?: string;
    primitives: MeshPrimitiveProps[];
  }

  /**
   * BoxMeshProps is an interface for defining properties of a box mesh.
   */
  interface BoxMeshProps {
    size?: ArrayLike<number>;
    segments?: ArrayLike<number>;
    material?: Material;
  }

  /**
   * The Mesh class represents a 3D object with one or more mesh primitives.
   */
  class Mesh {
    /**
     * An array of MeshPrimitive instances that define the geometry of the mesh.
     * @type {MeshPrimitive[]}
     */
    readonly primitives: MeshPrimitive[];
  }

  class NodeIterator {
    next(): { value: Node; done: boolean };
    [Symbol.iterator](): NodeIterator;
  }

  /**
   * Interface representing the properties you can create a Node object with.
   */
  interface NodeProps {
    /**
     * The initial name of the node.
     * @type {string | undefined}
     */
    name?: string;

    /**
     * The initial mesh associated with the node.
     * @type {Mesh | undefined}
     */
    mesh?: Mesh;

    /**
     * The initial UI canvas associated with the node.
     * @type {UICanvas | undefined}
     */
    uiCanvas?: UICanvas;

    /**
     * The initial translation of the node.
     * @type {Vector3 | undefined}
     */
    translation?: Vector3;

    /**
     * The initial rotation of the node.
     * @type {Quaternion | undefined}
     */
    rotation?: Quaternion;

    /**
     * The initial scale of the node.
     * @type {Vector3 | undefined}
     */
    scale?: Vector3;
  }

  /**
   * Interface representing the options for configuring an orbiting camera control mode.
   */
  interface OrbitOptions {
    /**
     * The pitch angle in degrees, which is the rotation around the X-axis.
     * Positive values tilt the camera upwards, while negative values tilt it downwards.
     * @type {number}
     */
    pitch?: number;

    /**
     * The yaw angle in degrees, which is the rotation around the Y-axis.
     * Positive values rotate the camera to the right, while negative values rotate it to the left.
     * @type {number}
     */
    yaw?: number;

    /**
     * The zoom value, which is a scalar factor for the distance from the object.
     * Positive values move the camera closer to the object, while negative values move it further away.
     * @type {number}
     */
    zoom?: number;
  }

  /**
   * Class representing a node in a scene graph.
   */
  class Node {
    /**
     * The node's translation as a Vector3.
     * @type {Vector3}
     * @readonly
     */
    readonly translation: Vector3;

    /**
     * The node's rotation as a Quaternion.
     * @type {Quaternion}
     * @readonly
     */
    readonly rotation: Quaternion;

    /**
     * The node's scale as a Vector3.
     * @type {Vector3}
     * @readonly
     */
    readonly scale: Vector3;

    /**
     * The node's local transformation matrix as a Matrix4.
     * @type {Matrix4}
     * @readonly
     */
    readonly matrix: Matrix4;

    /**
     * The node's world transformation matrix as a ReadonlyMatrix4.
     * @type {ReadonlyMatrix4}
     * @readonly
     */
    readonly worldMatrix: ReadonlyMatrix4;

    /**
     * Adds a child node to this node.
     * @param {Node} node The node to add as a child.
     * @returns {this} This node instance.
     */
    addChild(node: Node): this;

    /**
     * Removes a child node from this node.
     * @param {Node} node The node to remove.
     * @returns {this} This node instance.
     */
    removeChild(node: Node): this;

    /**
     * Gets the child node at the specified index.
     * @param {number} index The index of the child node.
     * @returns {Node | undefined} The child node or undefined if not found.
     */
    getChild(index: number): Node | undefined;

    /**
     * Returns an iterator for the children of this node.
     * @returns {NodeIterator} An iterator for the children of this node.
     */
    children(): NodeIterator;

    /**
     * Gets the parent node of this node.
     * @type {Node | undefined}
     * @readonly
     */
    get parent(): Node | undefined;

    /**
     * Gets or sets whether this node is static.
     * @type {boolean}
     */
    get isStatic(): boolean;
    set isStatic(value: boolean);

    /**
     * Gets or sets whether this node is visible.
     * @type {boolean}
     */
    get visible(): boolean;
    set visible(value: boolean);

    /**
     * Gets or sets the mesh associated with this node.
     * @type {Mesh | undefined}
     */
    get mesh(): Mesh | undefined;
    set mesh(mesh: Mesh | undefined);

    /**
     * Gets or sets the light associated with this node.
     * @type {Light | undefined}
     */
    get light(): Light | undefined;
    set light(light: Light | undefined);

    /**
     * Gets or sets the collider associated with this node.
     * @type {Collider | undefined}
     */
    get collider(): Collider | undefined;
    set collider(collider: Collider | undefined);

    /**
     * Gets or sets the UI canvas associated with this node.
     * @type {UICanvas | undefined}
     */
    get uiCanvas(): UICanvas | undefined;
    set uiCanvas(uiCanvas: UICanvas | undefined);

    /**
     * Gets the interactable component associated with this node.
     * @type {Interactable | undefined}
     * @readonly
     */
    get interactable(): Interactable | undefined;

    /**
     * Adds an interactable component to this node.
     * @param {InteractableProps | undefined} props Optional interactable properties.
     * @returns {Interactable} The newly created interactable component.
     */
    addInteractable(props?: InteractableProps): Interactable;

    /**
     * Removes the interactable component from this node.
     * @returns {undefined}
     */
    removeInteractable(): undefined;

    /**
     * Gets the physics body component associated with this node.
     * @type {PhysicsBody | undefined}
     * @readonly
     */
    get physicsBody(): PhysicsBody | undefined;

    /**
     * Adds a physics body component to this node.
     * @param {PhysicsBodyProps | undefined} props Optional physics body properties.
     * @returns {PhysicsBody} The newly created physics body component.
     */
    addPhysicsBody(props?: PhysicsBodyProps): PhysicsBody;

    /**
     * Removes the physics body component from this node.
     * @returns {undefined}
     */
    removePhysicsBody(): undefined;

    /**
     * Enables orbit camera control mode for this node.
     * @param {OrbitOptions | undefined} options Optional orbit options.
     * @returns {undefined}
     */
    startOrbit(options?: OrbitOptions): undefined;
    addComponent(component: ComponentStore): undefined;
    removeComponent(component: ComponentStore): undefined;
    hasComponent(component: ComponentStore): boolean;
    getComponent(component: ComponentStore): Component | undefined;
  }

  /**
   * Type representing the various physics body types.
   */
  type PhysicsBodyType = "kinematic" | "rigid" | "static";

  /**
   * Physics body type constants.
   */
  const PhysicsBodyType: {
    Kinematic: "kinematic";
    Rigid: "rigid";
    Static: "static";
  };

  /**
   * Interface representing the properties for creating a PhysicsBody.
   */
  interface PhysicsBodyProps {
    /**
     * The type of the physics body.
     * @type {PhysicsBodyType}
     */
    type: PhysicsBodyType;

    mass?: number;

    /**
     * The linear velocity of the physics body as an array of three numbers [x, y, z].
     * @type {ArrayLike<number>}
     */
    linearVelocity?: ArrayLike<number>;

    /**
     * The angular velocity of the physics body as an array of three numbers [x, y, z].
     * @type {ArrayLike<number>}
     */
    angularVelocity?: ArrayLike<number>;

    /**
     * The inertia tensor of the physics body as an array of three numbers [ix, iy, iz].
     * @type {ArrayLike<number>}
     */
    inertiaTensor?: ArrayLike<number>;
  }

  class PhysicsBody {
    applyImpulse(impulse: ArrayLike<number>): undefined;
  }

  class Collision {
    nodeA: Node;
    nodeB: Node;
    started: boolean;
  }

  class CollisionIterator {
    next(): { value: Collision; done: boolean };
    [Symbol.iterator](): CollisionIterator;
  }

  class CollisionListener {
    collisions(): CollisionIterator;
    dispose(): void;
  }

  /**
   * A Quaternion class with x, y, z, and w components. The class provides methods to set the components of the quaternion using an array-like syntax.
   */
  class Quaternion {
    /**
     * The quaternion components.
     * @type {number}
     */
    [n: number]: number;

    /**
     * The x-component of the quaternion.
     * @type {number}
     */
    x: number;

    /**
     * The y-component of the quaternion.
     * @type {number}
     */
    y: number;

    /**
     * The z-component of the quaternion.
     * @type {number}
     */
    z: number;

    /**
     * The w-component of the quaternion.
     * @type {number}
     */
    w: number;

    /**
     * Sets the quaternion components to the given values.
     * @param {ArrayLike<number>} value - An array-like object containing the quaternion components.
     */
    set(value: ArrayLike<number>): this;

    /**
     * The number of components in the quaternion.
     * @type {number}
     * @readonly
     */
    readonly length: number;
  }

  /**
   * Class representing an RGB color.
   */
  class RGB {
    /**
     * The RGB color components.
     * @type {number}
     */
    [n: number]: number;

    /**
     * The red component of the color.
     * @type {number}
     */
    r: number;

    /**
     * The green component of the color.
     * @type {number}
     */
    g: number;

    /**
     * The blue component of the color.
     * @type {number}
     */
    b: number;

    /**
     * Sets the RGB color components to the given values.
     * @param {ArrayLike<number>} value - An array-like object containing the RGB color components.
     */
    set(value: ArrayLike<number>): this;

    /**
     * The number of components in the RGB color.
     * @type {number}
     * @readonly
     */
    readonly length: number;
  }

  /**
   * Class representing an RGBA color.
   */
  class RGBA {
    /**
     * The RGBA color components.
     * @type {number}
     */
    [n: number]: number;

    /**
     * The red component of the color.
     * @type {number}
     */
    r: number;

    /**
     * The green component of the color.
     * @type {number}
     */
    g: number;

    /**
     * The blue component of the color.
     * @type {number}
     */
    b: number;

    /**
     * The alpha component of the color.
     * @type {number}
     */
    a: number;

    /**
     * Sets the RGBA color components to the given values.
     * @param {ArrayLike<number>} value - An array-like object containing the RGBA color components.
     */
    set(value: ArrayLike<number>): this;

    /**
     * The number of components in the RGBA color.
     * @type {number}
     * @readonly
     */
    readonly length: number;
  }

  /**
   * Interface representing the properties for a scene.
   * @typedef {Object} SceneProps
   * @property {string | undefined} name Optional name of the scene.
   */
  interface SceneProps {
    name?: string;
  }

  /**
   * Class representing a scene in a scene graph.
   */
  class Scene {
    /**
     * Adds a node to the scene.
     * @param {Node} node The node to be added to the scene.
     * @returns {Scene} The instance of the Scene class (for method chaining).
     */
    addNode(node: Node): this;

    /**
     * Removes a node from the scene.
     * @param {Node} node The node to be removed from the scene.
     * @returns {Scene} The instance of the Scene class (for method chaining).
     */
    removeNode(node: Node): this;

    /**
     * Gets a node from the scene by its index.
     * @param {number} index The index of the node to be retrieved.
     * @returns {Node | undefined} The node at the given index, or undefined if no node exists at the index.
     */
    getNode(index: number): Node | undefined;

    /**
     * Returns an iterator for the nodes in the scene.
     * @returns {NodeIterator} An iterator for the nodes in the scene.
     */
    nodes(): NodeIterator;
  }

  class Texture {}

  class Image {}

  /**
   * Interface for UIButton properties.
   * @extends UITextProps
   */
  interface UIButtonProps extends UITextProps {
    /**
     * The button label text.
     * @type {string}
     */
    label?: string;
  }

  /**
   * Class representing a UIButton element.
   * @extends UIText
   */
  class UIButton extends UIText {
    /**
     * Gets the button label text.
     * @type {string}
     * @readonly
     */
    get label(): string;

    /**
     * Sets the button label text.
     * @type {string}
     */
    set label(value: string);

    /**
     * Returns true if the button is pressed, otherwise false.
     * @type {boolean}
     * @readonly
     */
    get pressed(): boolean;

    /**
     * Returns true if the button is held, otherwise false.
     * @type {boolean}
     * @readonly
     */
    get held(): boolean;

    /**
     * Returns true if the button is released, otherwise false.
     * @type {boolean}
     * @readonly
     */
    get released(): boolean;
  }

  /**
   * Interface for UICanvas properties.
   */
  interface UICanvasProps {
    /**
     * The root UI element of the canvas.
     * @type {UIElement}
     */
    root?: UIElement;

    /**
     * The canvas width in pixels.
     * @type {number}
     */
    width?: number;

    /**
     * The canvas height in pixels.
     * @type {number}
     */
    height?: number;

    /**
     * The canvas size as an array-like object in meters.
     * @type {ArrayLike<number>}
     */
    size?: ArrayLike<number>;
  }

  /**
   * Class representing a UICanvas.
   */
  class UICanvas {
    /**
     * Gets the root UIElement of the canvas.
     * @type {UIElement}
     * @readonly
     */
    get root(): UIElement;

    /**
     * Sets the root UIElement of the canvas.
     * @type {UIElement}
     */
    set root(element: UIElement);

    /**
     * Gets the canvas width in pixels.
     * @type {number}
     * @readonly
     */
    get width(): number;

    /**
     * Sets the canvas width in pixels.
     * @type {number}
     */
    set width(value: number);

    /**
     * Gets the canvas height in pixels.
     * @type {number}
     * @readonly
     */
    get height(): number;

    /**
     * Sets the canvas height in pixels.
     * @type {number}
     */
    set height(value: number);

    /**
     * Redraws the canvas.
     * @returns {undefined}
     */
    redraw(): undefined;

    /**
     * Gets the canvas size as a Vector2 in meters.
     * @type {Vector2}
     * @readonly
     */
    readonly size: Vector2;
  }

  /**
   * Enum representing the type of a UIElement.
   * @typedef ElementType
   * @type {"flex" | "text" | "button"}
   */
  type ElementType = "flex" | "text" | "button";

  /**
   * Enum representing the flex direction for a UIElement.
   * @typedef FlexDirection
   * @type {"column" | "column-reverse" | "row" | "row-reverse"}
   */
  type FlexDirection = "column" | "column-reverse" | "row" | "row-reverse";

  /**
   * A type representing the possible values for the position property of a UIElement.
   * - "relative": The element is positioned relative to its normal position, without affecting the position of other elements.
   * - "absolute": The element is positioned relative to its nearest positioned ancestor (or the container if no positioned ancestor exists), and other elements are positioned as if the absolute element doesn't exist.
   * @typedef {("relative" | "absolute")} ElementPositionType
   */
  type ElementPositionType = "relative" | "absolute";

  /**
   * A type representing the possible values for the alignItems, alignContent, and alignSelf properties of a UIElement.
   * - "auto": The element's alignment is determined by its parent's alignItems property or by the default value if there is no parent.
   * - "flex-start": Items are aligned to the start of the container along the cross axis.
   * - "center": Items are centered within the container along the cross axis.
   * - "flex-end": Items are aligned to the end of the container along the cross axis.
   * - "stretch": Items are stretched to fill the container along the cross axis.
   * - "baseline": Items are aligned such that their baselines align along the cross axis.
   * - "space-between": Items are distributed evenly within the container with equal spacing between them along the cross axis.
   * - "space-around": Items are distributed evenly within the container with equal spacing around them along the cross axis.
   * @typedef {("auto" | "flex-start" | "center" | "flex-end" | "stretch" | "baseline" | "space-between" | "space-around")} FlexAlign
   */
  type FlexAlign =
    | "auto"
    | "flex-start"
    | "center"
    | "flex-end"
    | "stretch"
    | "baseline"
    | "space-between"
    | "space-around";

  /**
   * A type representing the possible values for the justifyContent property of a UIElement.
   * - "flex-start": Items are aligned to the start of the container.
   * - "center": Items are centered within the container.
   * - "flex-end": Items are aligned to the end of the container.
   * - "space-between": Items are distributed evenly within the container with equal spacing between them.
   * - "space-around": Items are distributed evenly within the container with equal spacing around them.
   * - "space-evenly": Items are distributed evenly within the container with equal spacing between and around them.
   * @typedef {("flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly")} FlexJustify
   */
  type FlexJustify = "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";

  /**
   * A type representing the possible values for the flexWrap property of a UIElement.
   * - "nowrap": Items are laid out in a single line (row or column) and may shrink or overflow the container.
   * - "wrap": Items are wrapped onto multiple lines (rows or columns) if they do not fit within the container.
   * - "wrap-reverse": Items are wrapped onto multiple lines (rows or columns) in reverse order if they do not fit within the container.
   * @typedef {("nowrap" | "wrap" | "wrap-reverse")} FlexWrap
   */
  type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";

  /**
   * Properties for the UIElement class.
   * @typedef UIElementProps
   * @type {Object}
   * @property {number} [top] - The distance from the top edge of the parent element.
   * @property {number} [right] - The distance from the right edge of the parent element.
   * @property {number} [bottom] - The distance from the bottom edge of the parent element.
   * @property {number} [left] - The distance from the left edge of the parent element.
   * @property {ElementPositionType} [position] - The position type of the element ("relative" or "absolute").
   * @property {FlexAlign} [alignContent] - The alignment of the element's content.
   * @property {FlexAlign} [alignItems] - The alignment of the element's items.
   * @property {FlexAlign} [alignSelf] - The alignment of the element itself.
   * @property {FlexDirection} [flexDirection] - The direction of the flex layout.
   * @property {FlexWrap} [flexWrap] - The wrapping behavior of the flex layout.
   * @property {number} [flexBasis] - The initial size of the element along the main axis.
   * @property {number} [flexGrow] - The factor by which the element should grow if there is extra space.
   * @property {number} [flexShrink] - The factor by which the element should shrink if there is not enough space.
   * @property {FlexJustify} [justifyContent] - The justification of the element's content.
   * @property {number} [width] - The width of the element.
   * @property {number} [height] - The height of the element.
   * @property {number} [minWidth] - The minimum width of the element.
   * @property {number} [minHeight] - The minimum height of the element.
   * @property {number} [maxWidth] - The maximum width of the element.
   * @property {number} [maxHeight] - The maximum height of the element.
   * @property {ArrayLike<number>} [backgroundColor] - The background color of the element.
   * @property {ArrayLike<number>} [borderColor] - The border color of the element.
   * @property {ArrayLike<number>} [padding] - The padding of the element.
   * @property {ArrayLike<number>} [margin] - The margin of the element.
   * @property {ArrayLike<number>} [borderWidth] - The border width of the element.
   * @property {ArrayLike<number>} [borderRadius] - The border radius of the element.
   */
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

  /**
   * Class representing a user interface element.
   */
  class UIElement {
    /**
     * Gets the position of the UI element.
     * @returns {ElementPositionType} The position type of the UI element.
     */
    get position(): ElementPositionType;

    /**
     * Sets the position of the UI element.
     * @param {ElementPositionType} value The new position type for the UI element.
     */
    set position(value: ElementPositionType);

    /**
     * Gets the top position of the UI element.
     * @returns {number} The top position value of the UI element.
     */
    get top(): number;

    /**
     * Sets the top position of the UI element.
     * @param {number} value The new top position value for the UI element.
     */
    set top(value: number);

    /**
     * Gets the right position of the UI element.
     * @returns {number} The right position value of the UI element.
     */
    get right(): number;

    /**
     * Sets the right position of the UI element.
     * @param {number} value The new right position value for the UI element.
     */
    set right(value: number);

    /**
     * Gets the bottom position of the UI element.
     * @returns {number} The bottom position value of the UI element.
     */
    get bottom(): number;

    /**
     * Sets the bottom position of the UI element.
     * @param {number} value The new bottom position value for the UI element.
     */
    set bottom(value: number);

    /**
     * Gets the left position of the UI element.
     * @returns {number} The left position value of the UI element.
     */
    get left(): number;

    /**
     * Sets the left position of the UI element.
     * @param {number} value The new left position value for the UI element.
     */
    set left(value: number);

    /**
     * Gets the align-content property of the UI element.
     * @returns {FlexAlign} The align-content value of the UI element.
     */
    get alignContent(): FlexAlign;

    /**
     * Sets the align-content property of the UI element.
     * @param {FlexAlign} value The new align-content value for the UI element.
     */
    set alignContent(value: FlexAlign);

    /**
     * Gets the align-items property of the UI element.
     * @returns {FlexAlign} The align-items value of the UI element.
     */
    get alignItems(): FlexAlign;

    /**
     * Sets the align-items property of the UI element.
     * @param {FlexAlign} value The new align-items value for the UI element.
     */
    set alignItems(value: FlexAlign);

    /**
     * Gets the align-self property of the UI element.
     * @returns {FlexAlign} The align-self value of the UI element.
     */
    get alignSelf(): FlexAlign;

    /**
     * Sets the align-self property of the UI element.
     * @param {FlexAlign} value The new align-self value for the UI element.
     */
    set alignSelf(value: FlexAlign);

    /**
     * Gets the flex-direction property of the UI element.
     * @returns {FlexDirection} The flex-direction value of the UI element.
     */
    get flexDirection(): FlexDirection;

    /**
     * Sets the flex-direction property of the UI element.
     * @param {FlexDirection} value The new flex-direction value for the UI element.
     */
    set flexDirection(value: FlexDirection);

    /**
     * Gets the flex wrap property of the UI element.
     * @returns {FlexWrap} The flex wrap property value.
     */
    get flexWrap(): FlexWrap;

    /**
     * Sets the flex wrap property of the UI element.
     * @param {FlexWrap} value The new flex wrap property value.
     */
    set flexWrap(value: FlexWrap);

    /**
     * Gets the flex basis property of the UI element.
     * @returns {number} The flex basis property value.
     */
    get flexBasis(): number;

    /**
     * Sets the flex basis property of the UI element.
     * @param {number} value The new flex basis property value.
     */
    set flexBasis(value: number);

    /**
     * Gets the flex grow property of the UI element.
     * @returns {number} The flex grow property value.
     */
    get flexGrow(): number;

    /**
     * Sets the flex grow property of the UI element.
     * @param {number} value The new flex grow property value.
     */
    set flexGrow(value: number);

    /**
     * Gets the flex shrink property of the UI element.
     * @returns {number} The flex shrink property value.
     */
    get flexShrink(): number;

    /**
     * Sets the flex shrink property of the UI element.
     * @param {number} value The new flex shrink property value.
     */
    set flexShrink(value: number);

    /**
     * Gets the justify content property of the UI element.
     * @returns {FlexJustify} The justify content property value.
     */
    get justifyContent(): FlexJustify;

    /**
     * Sets the justify content property of the UI element.
     * @param {FlexJustify} value The new justify content property value.
     */
    set justifyContent(value: FlexJustify);

    /**
     * Gets the width of the UI element.
     * @returns {number} The width of the UI element.
     */
    get width(): number;

    /**
     * Sets the width of the UI element.
     * @param {number} value The new width of the UI element.
     */
    set width(value: number);

    /**
     * Gets the height of the UI element.
     * @returns {number} The height of the UI element.
     */
    get height(): number;

    /**
     * Sets the height of the UI element.
     * @param {number} value The new height of the UI element.
     */
    set height(value: number);

    /**
     * Gets the minimum width of the UI element.
     * @returns {number} The minimum width of the UI element.
     */
    get minWidth(): number;

    /**
     * Sets the minimum width of the UI element.
     * @param {number} value The new minimum width of the UI element.
     */
    set minWidth(value: number);

    /**
     * Gets the minimum height of the UI element.
     * @returns {number} The minimum height of the UI element.
     */
    get minHeight(): number;

    /**
     * Sets the minimum height of the UI element.
     * @param {number} value The new minimum height of the UI element.
     */
    set minHeight(value: number);

    /**
     * Gets the maximum width of the UI element.
     * @returns {number} The maximum width of the UI element.
     */
    get maxWidth(): number;

    /**
     * Sets the maximum width of the UI element.
     * @param {number} value The new maximum width of the UI element.
     */
    set maxWidth(value: number);

    /**
     * Gets the maximum height of the UI element.
     * @returns {number} The maximum height of the UI element.
     */
    get maxHeight(): number;

    /**
     * Sets the maximum height of the UI element.
     * @param {number} value The new maximum height of the UI element.
     */
    set maxHeight(value: number);
    /**
     * Adds a child UI element to the current element.
     * @param {UIElement} element The child UI element to add.
     * @returns {this} The current UI element for chaining.
     */
    addChild(element: UIElement): this;

    /**
     * Removes a child UI element from the current element.
     * @param {UIElement} element The child UI element to remove.
     * @returns {this} The current UI element for chaining.
     */
    removeChild(element: UIElement): this;

    /**
     * Gets the child UI element at the specified index.
     * @param {number} index The index of the child UI element.
     * @returns {UIElement | undefined} The child UI element or undefined if the index is out of bounds.
     */
    getChild(index: number): UIElement | undefined;

    /**
     * Returns an iterator for the children of the current UI element.
     * @returns {UIElementIterator} An iterator for the children of the current UI element.
     */
    children(): UIElementIterator;

    /**
     * Gets the parent UI element of the current element.
     * @returns {UIElement | undefined} The parent UI element or undefined if there is no parent.
     */
    get parent(): UIElement | undefined;

    /**
     * Gets the type of the UI element.
     * @returns {ElementType} The type of the UI element.
     */
    get type(): ElementType;

    /**
     * Readonly RGBA object representing the background color of the UI element.
     * @type {RGBA}
     */
    readonly backgroundColor: RGBA;

    /**
     * Readonly RGBA object representing the border color of the UI element.
     * @type {RGBA}
     */
    readonly borderColor: RGBA;

    /**
     * Readonly Vector4 object representing the padding of the UI element.
     * @type {Vector4}
     */
    readonly padding: Vector4;

    /**
     * Readonly Vector4 object representing the margin of the UI element.
     * @type {Vector4}
     */
    readonly margin: Vector4;

    /**
     * Readonly Vector4 object representing the border width of the UI element.
     * @type {Vector4}
     */
    readonly borderWidth: Vector4;

    /**
     * Readonly Vector4 object representing the border radius of the UI element.
     * @type {Vector4}
     */
    readonly borderRadius: Vector4;
  }

  /**
   * Interface for the properties of a UIText element.
   * @extends UIElementProps
   */
  interface UITextProps extends UIElementProps {
    /**
     * The text content of the UIText element.
     * @type {string}
     */
    value?: string;

    /**
     * The font family used for the text.
     * @type {string}
     */
    fontFamily?: string;

    /**
     * The font style used for the text, e.g. 'normal' or 'italic'.
     * @type {string}
     */
    fontStyle?: string;

    /**
     * The font weight used for the text, e.g. 'normal', 'bold', or a numeric value.
     * @type {string}
     */
    fontWeight?: string;

    /**
     * The color of the text as an array-like structure of [r, g, b, a] values, where each value is in the range [0, 1].
     * @type {ArrayLike<number>}
     */
    color?: ArrayLike<number>;

    /**
     * The font size of the text in pixels.
     * @type {number}
     */
    fontSize?: number;
  }

  /**
   * Class representing a text element within a user interface.
   * @extends UIElement
   */
  class UIText extends UIElement {
    /**
     * Gets the text content of the UIText element.
     * @returns {string} The text content.
     */
    get value(): string;

    /**
     * Sets the text content of the UIText element.
     * @param {string} value - The new text content.
     */
    set value(value: string);

    /**
     * Gets the font family used for the text.
     * @returns {string} The font family.
     */
    get fontFamily(): string;

    /**
     * Sets the font family used for the text.
     * @param {string} value - The new font family.
     */
    set fontFamily(value: string);

    /**
     * Gets the font weight used for the text.
     * @returns {string} The font weight.
     */
    get fontWeight(): string;

    /**
     * Sets the font weight used for the text.
     * @param {string} value - The new font weight.
     */
    set fontWeight(value: string);

    /**
     * Gets the font size of the text in pixels.
     * @returns {number} The font size.
     */
    get fontSize(): number;

    /**
     * Sets the font size of the text in pixels.
     * @param {number} value - The new font size.
     */
    set fontSize(value: number);

    /**
     * Gets the font style used for the text.
     * @returns {string} The font style.
     */
    get fontStyle(): string;

    /**
     * Sets the font style used for the text.
     * @param {string} value - The new font style.
     */
    set fontStyle(value: string);

    /**
     * Readonly property representing the color of the text as an RGBA object.
     * @type {RGBA}
     */
    readonly color: RGBA;
  }

  /**
   * A 2-dimensional vector class.
   * @class Vector2
   */
  class Vector2 {
    [index: number]: number;
    x: number;
    y: number;
    constructor();
    constructor(x: number, y: number);
    constructor(array: ArrayLike<number>);
    set(value: ArrayLike<number>): this;
    setScalar(value: number): this;
    add(vector: ArrayLike<number>): this;
    addVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    addScaledVector(vector: ArrayLike<number>, scale: number): this;
    subtract(vector: ArrayLike<number>): this;
    subtractVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    subtractScaledVector(vector: ArrayLike<number>, scale: number): this;
    multiply(vector: ArrayLike<number>): this;
    multiplyVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    multiplyScalar(scalar: number): this;
    divide(vector: ArrayLike<number>): this;
    divideVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    divideScalar(scalar: number): this;
    readonly length: number;
  }

  /**
   * A 3-dimensional vector class.
   * @class Vector3
   */
  class Vector3 {
    [index: number]: number;
    x: number;
    y: number;
    z: number;
    constructor();
    constructor(x: number, y: number, z: number);
    constructor(array: ArrayLike<number>);
    set(value: ArrayLike<number>): this;
    setScalar(value: number): this;
    add(vector: ArrayLike<number>): this;
    addVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    addScaledVector(vector: ArrayLike<number>, scale: number): this;
    subtract(vector: ArrayLike<number>): this;
    subtractVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    subtractScaledVector(vector: ArrayLike<number>, scale: number): this;
    multiply(vector: ArrayLike<number>): this;
    multiplyVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    multiplyScalar(scalar: number): this;
    divide(vector: ArrayLike<number>): this;
    divideVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    divideScalar(scalar: number): this;
    readonly length: number;
  }

  /**
   * A 4-dimensional vector class.
   * @class Vector4
   */
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
    constructor();
    constructor(x: number, y: number, z: number, w: number);
    constructor(array: ArrayLike<number>);
    set(value: ArrayLike<number>): this;
    setScalar(value: number): this;
    add(vector: ArrayLike<number>): this;
    addVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    addScaledVector(vector: ArrayLike<number>, scale: number): this;
    subtract(vector: ArrayLike<number>): this;
    subtractVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    subtractScaledVector(vector: ArrayLike<number>, scale: number): this;
    multiply(vector: ArrayLike<number>): this;
    multiplyVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    multiplyScalar(scalar: number): this;
    divide(vector: ArrayLike<number>): this;
    divideVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    divideScalar(scalar: number): this;
    readonly length: number;
  }

  class ComponentStore {}

  class Component {
    [propName: string]: unknown;
  }

  /**
   * Class representing a 3D world composed of {@link WebSG.Scene | scenes}, {@link WebSG.Node | nodes},
   * {@link WebSG.Mesh | meshes}, {@link WebSG.Material | materials}, and other properties defined by
   * the [glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).
   *
   * Currently a World contains resources loaded for the environment's glTF document. This means you do not have direct
   * access to user's avatars in the world's scene graph. On script initialization, the world will be empty. It is not
   * until {@link WebSG.World.onload | world.onload} is called that {@link WebSG.World.environment | world.environment}
   * will be set to the default {@link WebSG.Scene | scene} in the world's initial glTF document. All other resources
   * such as textures, materials, and meshes referenced by the document will be loaded at this time and can be accessed
   * via methods such as {@link WebSG.World.findNodeByName | world.findNodeByName }.
   *
   * @example
   * In the following example {@link WebSG.World.findNodeByName | world.findNodeByName } is used to
   * find a {@link WebSG.Node | node } by its name and log the reference to the console.
   * ```js
   * // World not yet loaded
   *
   * world.onload = () => {
   *   // World loaded
   *   const lightNode = world.findNodeByName("Light");
   *   console.log(lightNode);
   * };
   * ```
   *
   * Once a world is loaded you can modify the scene graph by adding, removing, or modifying nodes.
   *
   * @example
   * ```js
   * world.onload = () => {
   *   const newNode = world.createNode();
   *   world.environment.addNode(newNode); // Nodes must be added to a scene to be rendered
   *
   *   newNode.mesh = world.findMeshByName("Teapot");
   *
   *   world.environment.removeNode(newNode);
   * };
   * ```
   *
   * If you want to modify the scene graph each frame you can use the
   * {@link WebSG.World.onupdate | world.onupdate} callback.
   *
   * @example
   * ```js
   * world.onload = () => {
   *   const newNode = world.createNode();
   *   world.environment.addNode(newNode);
   *
   *   newNode.mesh = world.findMeshByName("Teapot");
   *
   *   world.onupdate = (dt, time) => {
   *     newNode.translation.y = Math.sin(time) * 5;
   *   };
   * };
   * ```
   *
   * Once the local user has entered the world, the networking interface will be fully initialized. You access
   * the local user's {@link WebSGNetworking.Peer | peer} via the global
   * {@link WebSGNetworking.Network | network.local} variable. This can be used to get the local user's transform.
   *
   * @example
   * ```js
   * world.onenter = () => {
   *   const localUser = network.local;
   *   console.log(localUser.transform);
   *   console.log(localUser.rotation);
   * };
   * ```
   *
   * Overall, world is the main interface for creating new resources. See the individual factory functions
   * for more details.
   */
  class World {
    /**
     * Gets the environment of the world.
     * Note this is not set until `world.onload` is called.
     * @returns {Scene} The environment scene of the world.
     */
    get environment(): Scene;

    /**
     * Sets the environment of the world.
     * @param {Scene} scene The new environment scene for the world.
     */
    set environment(scene: Scene);

    /**
     * Creates an Accessor from the given ArrayBuffer and properties.
     * @param {ArrayBuffer} buffer The ArrayBuffer to create the Accessor from.
     * @param {AccessorFromProps} props The properties for the new Accessor.
     * @returns {Accessor} The created Accessor.
     */
    createAccessorFrom(buffer: ArrayBuffer, props: AccessorFromProps): Accessor;

    /**
     * Finds an Accessor by its name.
     * @param {string} name The name of the Accessor to find.
     * @returns {Accessor | undefined} The found Accessor or undefined if not found.
     */
    findAccessorByName(name: string): Accessor | undefined;

    /**
     * Creates a Collider with the given properties.
     * @param {ColliderProps} props The properties for the new Collider.
     * @returns {Collider} The created Collider.
     */
    createCollider(props: ColliderProps): Collider;

    /**
     * Finds a Collider by its name.
     * @param {string} name The name of the Collider to find.
     * @returns {Collider | undefined} The found Collider or undefined if not found.
     */
    findColliderByName(name: string): Collider | undefined;

    /**
     * Creates a Light with the given properties.
     * @param {LightProps} props The properties for the new Light.
     * @returns {Light} The created Light.
     */
    createLight(props: LightProps): Light;

    /**
     * Finds a Light by its name.
     * @param {string} name The name of the Light to find.
     * @returns {Light | undefined} The found Light or undefined if not found.
     */
    findLightByName(name: string): Light | undefined;

    /**
     * Creates an unlit Material with the given properties.
     * @param {UnlitMaterialProps} props The properties for the new unlit Material.
     * @returns {Material} The created unlit Material.
     */
    createUnlitMaterial(props: UnlitMaterialProps): Material;

    /**
     * Creates a Material with the given properties.
     * @param {MaterialProps} props The properties for the new Material.
     * @returns {Material} The created Material.
     */
    createMaterial(props: MaterialProps): Material;

    /**
     * Finds a Material by its name.
     * @param {string} name The name of the Material to find.
     * @returns {Material | undefined} The found Material or undefined if not found.
     */
    findMaterialByName(name: string): Material | undefined;

    /**
     * Creates a Mesh with the given properties.
     * @param {MeshProps} props The properties for the new Mesh.
     * @returns {Mesh} The created Mesh.
     */
    createMesh(props: MeshProps): Mesh;

    /**
     * Creates a Box Mesh with the given properties.
     * @param {BoxMeshProps} props The properties for the new Box Mesh.
     * @returns {Mesh} The created Box Mesh.
     */
    createBoxMesh(props: BoxMeshProps): Mesh;

    /**
     * Finds a mesh by its name.
     * @method findMeshByName
     * @param {string} name - The name of the mesh to find.
     * @returns {Mesh | undefined} - The mesh found or undefined if not found.
     */
    findMeshByName(name: string): Mesh | undefined;

    /**
     * Creates a new node with the given properties.
     * @method createNode
     * @param {NodeProps?} props - Optional properties to set for the new node.
     * @returns {Node} - The created node.
     */
    createNode(props?: NodeProps): Node;

    /**
     * Finds a node by its name.
     * @method findNodeByName
     * @param {string} name - The name of the node to find.
     * @returns {Node | undefined} - The node found or undefined if not found.
     */
    findNodeByName(name: string): Node | undefined;

    /**
     * Creates a new scene with the given properties.
     * @method createScene
     * @param {SceneProps?} props - Optional properties to set for the new scene.
     * @returns {Scene} - The created scene.
     */
    createScene(props?: SceneProps): Scene;

    /**
     * Finds a scene by its name.
     * @method findSceneByName
     * @param {string} name - The name of the scene to find.
     * @returns {Scene | undefined} - The scene found or undefined if not found.
     */
    findSceneByName(name: string): Scene | undefined;

    /**
     * Finds a texture by its name.
     * @method findTextureByName
     * @param {string} name - The name of the texture to find.
     * @returns {Texture | undefined} - The texture found or undefined if not found.
     */
    findTextureByName(name: string): Texture | undefined;

    findImageByName(name: string): Image | undefined;

    /**
     * Creates a new UICanvas with the given properties.
     * @method createUICanvas
     * @param {UICanvasProps?} props - Optional properties to set for the new UICanvas.
     * @returns {UICanvas} - The created UICanvas.
     */
    createUICanvas(props?: UICanvasProps): UICanvas;

    /**
     * Finds a UICanvas by its name.
     * @method findUICanvasByName
     * @param {string} name - The name of the UICanvas to find.
     * @returns {UICanvas | undefined} - The UICanvas found or undefined if not found.
     */
    findUICanvasByName(name: string): UICanvas | undefined;

    /**
     * Creates a new UIElement with the given properties.
     * @method createUIElement
     * @param {UIElementProps?} props - Optional properties to set for the new UIElement.
     * @returns {UIElement} - The created UIElement.
     */
    createUIElement(props?: UIElementProps): UIElement;

    /**
     * Creates a new UIText with the given properties.
     * @method createUIText
     * @param {UITextProps?} props - Optional properties to set for the new UIText.
     * @returns {UIText} - The created UIText.
     */
    createUIText(props?: UITextProps): UIText;

    /**
     * Creates a new UIButton with the given properties.
     * @method create
     * @method createUIButton
     * @param {UIButtonProps?} props - Optional properties to set for the new UIButton.
     * @returns {UIButton} - The created UIButton.
     */
    createUIButton(props?: UIButtonProps): UIButton;

    /**
     * Finds a UIElement by its name.
     * @method findUIElementByName
     * @param {string} name - The name of the UIElement to find.
     * @returns {UIElement | undefined} - The UIElement found or undefined if not found.
     */
    findUIElementByName(name: string): UIElement | undefined;
    createCollisionListener(): CollisionListener;
    get componentStoreSize(): number;
    set componentStoreSize(value: number);
    findComponentStoreByName(name: string): ComponentStore | undefined;
    /**
     * Stops any ongoing orbiting operation.
     */
    stopOrbit(): undefined;
    get primaryInputSourceOrigin(): Vector3;
    get primaryInputSourceDirection(): Vector3;
    /**
     * Called when the world is loaded.
     * @method onload
     */
    onload: (() => any) | null;

    /**
     * Called when the user enters the world.
     * @method onenter
     */
    onenter: (() => any) | null;

    /**
     * Called when the world is updated.
     * @method onupdate
     * @param {number} dt - The time since the last update in seconds.
     * @param {number} time - The total time since the start of the world in seconds.
     */
    onupdate: ((dt: number, time: number) => any) | null;
  }
}

/**
 * The global world instance.
 * @global {WebSG.World} world
 */
declare const world: WebSG.World;

declare namespace WebSGNetworking {
  class Peer {
    get id(): string;
    get isHost(): boolean;
    get isLocal(): boolean;
    get translation(): WebSG.Vector3;
    get rotation(): WebSG.Quaternion;
    send(message: string | ArrayBuffer, reliable: boolean): undefined;
  }

  class NetworkMessage {
    peer: Peer;
    data: ArrayBuffer | string;
    bytesWritten: number;
    isBinary: boolean;
  }

  class NetworkMessageIterator {
    next(): { value: NetworkMessage; done: boolean };
    [Symbol.iterator](): NetworkMessageIterator;
  }

  class NetworkListener {
    receive(buffer?: ArrayBuffer): NetworkMessageIterator;
    close(): undefined;
  }

  /**
   * Represents the networking methods available
   * for sending and receiving data in a WebSG app.
   */
  class Network {
    get host(): Peer | undefined;
    get local(): Peer | undefined;
    listen(): NetworkListener;

    /**
     * Broadcasts data to all connected clients.
     * @param {ArrayBuffer} data - The data to be broadcasted.
     * @returns {undefined}
     */
    broadcast(message: string | ArrayBuffer, reliable: boolean): undefined;
    onpeerentered: ((peer: Peer) => any) | null;
    onpeerexited: ((peer: Peer) => any) | null;
  }
}

declare const network: WebSGNetworking.Network;

declare namespace ThirdRoom {
  class ActionBarListener {
    actions(): ActionBarIterator;
    dispose(): undefined;
  }

  class ActionBarIterator {
    next(): { value: string; done: boolean };
    [Symbol.iterator](): ActionBarIterator;
  }

  interface ActionBarItem {
    id: string;
    label: string;
    thumbnail: WebSG.Image;
  }

  /**
   * Represents the action bar at the bottom of the screen.
   * Items can be set via the {@link ThirdRoom.ActionBar.setItems} method.
   * You can listen for triggered actions by creating a new listener via the
   * {@link ThirdRoom.ActionBar.createListener} method.
   */
  class ActionBar {
    setItems(items: ActionBarItem[]): undefined;
    createListener(): ActionBarListener;
  }
}

declare class ThirdRoom {
  /**
   * Enables or disables the use of the custom Matrix-style material on the world.
   *
   * @experimental Note that this is not a standard function and could be removed or disabled in the future.
   * @param {boolean} enabled - Whether to enable or disable Matrix materials.
   * @returns {undefined}
   */
  enableMatrixMaterial(enabled: boolean): undefined;

  /**
   * Gets the size of the local audio input source's audio data buffer.
   * Similar to the WebAudio [AnalyserNode.frequencyBinCount](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/frequencyBinCount)
   * @returns {number} - The size of the audio data buffer.
   */
  getAudioDataSize(): number;

  /**
   * Gets the local audio input source's time data and fills the provided Uint8Array.
   * The data array must be at least the size returned by {@link ThirdRoom.getAudioDataSize | getAudioDataSize}.
   * Similar to the WebAudio [AnalyserNode.getByteTimeDomainData](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteTimeDomainData)
   * @param {Uint8Array} data - The array to store the audio time data.
   * @returns {number} - The number of elements filled in the data array.
   */
  getAudioTimeData(data: Float32Array): number;

  /**
   * Gets the local audio input source's frequency data and fills the provided Uint8Array.
   * The data array must be at least the size returned by {@link ThirdRoom.getAudioDataSize | getAudioDataSize}.
   * Similar to the WebAudio [AnalyserNode.getByteFrequencyData](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteFrequencyData)
   * @param {Uint8Array} data - The array to store the audio frequency data.
   * @returns {number} - The number of elements filled in the data array.
   */
  getAudioFrequencyData(data: Float32Array): number;

  /**
   * Determines if the local user is currently in an Augmented Reality (AR) environment.
   * Checks to see if the local user is in immersive AR mode and if the world supports AR.
   * @returns {boolean} - True if the script is running in an AR environment, false otherwise.
   */
  inAR(): boolean;

  /**
   * Returns the {@link ThirdRoom.ActionBar | ActionBar} object.
   */
  get actionBar(): ThirdRoom.ActionBar;
}

/**
 * The global ThirdRoom instance.
 * @global {ThirdRoom} thirdroom
 */
declare const thirdroom: ThirdRoom;

/**
 * MatrixWidgetAPIRequest interface represents a request sent to or from a Matrix widget.
 */
interface MatrixWidgetAPIRequest {
  api: "fromWidget" | "toWidget";
  requestId: string;
  action: string;
  widgetId: string;
  data: unknown;
}

/**
 * MatrixWidgetAPIResponse interface represents a response to a Matrix widget API request.
 */
interface MatrixWidgetAPIResponse extends MatrixWidgetAPIRequest {
  response: unknown;
}

/**
 * MatrixWidgetAPIErrorResponse interface represents an error response to a Matrix widget API request.
 */
interface MatrixWidgetAPIErrorResponse extends MatrixWidgetAPIResponse {
  response: {
    error: {
      message: string;
    };
  };
}

type MatrixAPIMessage = MatrixWidgetAPIRequest | MatrixWidgetAPIResponse | MatrixWidgetAPIErrorResponse;

/**
 * MatrixWidgetAPI interface represents the Matrix widget API methods for sending and receiving messages.
 */
interface MatrixWidgetAPI {
  /**
   * Starts listening for Matrix API messages.
   * @returns {undefined}
   */
  listen(): undefined;

  /**
   * Closes the Matrix API message listener.
   * @returns {undefined}
   */
  close(): undefined;

  /**
   * Receives a Matrix API message. Returns the received message or undefined if no message is available.
   * @returns {MatrixAPIMessage | undefined} - The received Matrix API message or undefined if no message is available.
   */
  receive(): MatrixAPIMessage | undefined;

  /**
   * Sends a Matrix API message.
   * @param {MatrixAPIMessage} event - The Matrix API message to send.
   * @returns {undefined}
   */
  send(event: MatrixAPIMessage): undefined;
}

/**
 * The global Matrix widget API instance.
 * @global {MatrixWidgetAPI} matrix
 */
declare const matrix: MatrixWidgetAPI;

interface Console {
  /**
   * Logs the provided data to the browser's console.
   * @param {...any[]} data - The data to be logged.
   * @returns {void}
   */
  log(...data: any[]): void;
}

/**
 * The global Console instance.
 * @global {Console} console
 */
declare const console: Console;

/**
 * The global scope of a WebSG script. All scripts have access to these global properties.
 *
 * @example
 * In the following example {@link WebSG.World.findNodeByName | world.findNodeByName } is used to
 * find {@link WebSG.Node | nodes } by their name defined in the associated glTF document.
 *
 * {@link WebSG.World.onload | world.onload } and {@link WebSG.World.onupdate | world.onupdate }
 * are lifecycle methods that are called when the world is loaded and updated on each frame.
 * ```js
 * world.onload = () => {
 *   const lightNode = world.findNodeByName("Light");
 *
 *   const lightSwitch = world.findNodeByName("LightSwitch");
 *   lightSwitch.addInteractable();
 *
 *   let lightOn = true;
 *
 *   world.onupdate = (dt) => {
 *     if (lightSwitch.interactable.pressed) {
 *       lightOn = !lightOn;
 *       lightNode.light.intensity = lightOn ? 20 : 0;
 *     }
 *   };
 * };
 * ```
 */
declare interface WebSGGlobalScope {
  /**
   * Returns the {@link Console | console } associated with the current script.
   * Used for logging messages to the browser's console.
   */
  readonly console: Console;

  /**
   * Returns the {@link WebSG.World | world } associated with the current script.
   * Used for accessing the current world's scene graph and other world properties/methods.
   */
  readonly world: WebSG.World;

  /**
   * Returns the {@link ThirdRoom | thirdroom } instance associated with the current script.
   * Used for ThirdRoom-specific properties/methods not available in the WebSG API.
   */
  readonly thirdroom: ThirdRoom;

  /**
   * Returns the {@link MatrixWidgetAPI | matrix } instance associated with the current script.
   * Used for sending and receiving matrix events to and from the associated matrix room.
   */
  readonly matrix: MatrixWidgetAPI;

  /**
   * Returns the {@link WebSGNetworking.Network | network } instance associated with the current script.
   * Used for sending and receiving network messages to and from other peers in the room over WebRTC.
   */
  readonly network: WebSGNetworking.Network;
}
