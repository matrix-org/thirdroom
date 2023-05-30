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
   * Interface describing the properties of an Accessor created from an ArrayBuffer.
   */
  interface AccessorFromProps {
    /**
     * The shape of the data the accessor represents.
     */
    type: AccessorType;
    /**
     * The data type of individual components in the data.
     */
    componentType: AccessorComponentType;
    /**
     * The number of elements in the accessor.
     */
    count: number;
    /**
     * Whether the data should be normalized when accessed (default is `false`).
     */
    normalized?: boolean;
    /**
     * Whether the accessor's data is dynamic and can change over time (default is `false`).
     */
    dynamic?: boolean;
    /**
     * The minimum values of the accessor's components (optional).
     */
    min?: number[];
    /**
     * The maximum values of the accessor's components (optional).
     */
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
     * @param data The new data to update the ArrayBuffer.
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
   */
  interface ColliderProps {
    /**
     * The type of the Collider.
     */
    type: ColliderType;
    /**
     * Determines if the Collider acts as a trigger.
     */
    isTrigger?: boolean;
    /**
     * The size of the Collider (required for box type).
     */
    size?: ArrayLike<number>;
    /**
     * The radius of the Collider (required for sphere, capsule, and cylinder types).
     */
    radius?: number;
    /**
     * The height of the Collider (required for capsule and cylinder types).
     */
    height?: number;
    /**
     * The mesh representing the shape of the Collider (required for hull and trimesh types).
     */
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
     * @param props The properties of the Collider.
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
     *
     * @example
     * node.addInteractable();
     * console.log(node.interactable.pressed); // false
     */
    get pressed(): boolean;

    /**
     * Returns the held state of the Interactable object.
     *
     * @example
     * node.addInteractable();
     * console.log(node.interactable.held); // false
     */
    get held(): boolean;

    /**
     * Returns the released state of the Interactable object.
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
   */
  interface LightProps {
    /**
     * The type of the light.
     */
    type: LightType;
    /**
     * The optional name of the light.
     */
    name?: string;
    /**
     * The optional intensity of the light. Default is 1.
     */
    intensity?: number;
    /**
     * The optional RGB color of the light. Default is white.
     */
    color?: ArrayLike<number>;
    /**
     * The optional range of the light, for point and spot lights.
     */
    range?: number;
    /**
     * The optional inner cone angle of the light, for spot lights.
     */
    innerConeAngle?: number;
    /**
     * The optional outer cone angle of the light, for spot lights.
     */
    outerConeAngle?: number;
  }

  /**
   * The Light class represents a light source in a scene.
   */
  class Light {
    /**
     * Creates a new Light instance.
     * @param props The properties to create the light with.
     */
    constructor(props: LightProps);

    /**
     * Returns the intensity of the Light object.
     *
     * @example
     * const light = world.createLight({ type: LightType.Point });
     * console.log(light.intensity); // 1
     */
    get intensity(): number;

    /**
     * Sets the intensity of the Light object.
     * @param value - The new intensity value for the Light object.
     *
     * @example
     * const light = world.createLight({ type: LightType.Point });
     * light.intensity = 2;
     * console.log(light.intensity); // 2
     */
    set intensity(value: number);

    /**
     * Returns the color of the Light object as an RGB instance.
     *
     * @example
     * const light = world.createLight({ type: LightType.Point, color: [1, 0, 0] });
     * console.log(light.color); // RGB { r: 1, g: 0, b: 0 }
     */
    get color(): RGB;
  }

  /**
   * AlphaMode is a union type representing the available alpha modes.
   */
  type AlphaMode = "OPAQUE" | "BLEND" | "MASK";

  /**
   * AlphaMode is an object containing the string constants for the available alpha modes.
   */
  const AlphaMode: { [Mode in AlphaMode]: Mode };

  /**
   * UnlitMaterialProps is an interface that defines the properties for creating an unlit Material instance.
   */
  interface UnlitMaterialProps {
    /**
     * The name of the material.
     */
    name?: string;
    /**
     * The RGBA base color factor.
     */
    baseColorFactor?: ArrayLike<number>;
    /**
     * The base color texture.
     */
    baseColorTexture?: Texture;
    /**
     * Whether the material is visible from both sides. Default is false.
     */
    doubleSided?: boolean;
    /**
     * The alpha cutoff value for the material. Default is 0.5.
     */
    alphaCutoff?: number;
    /**
     * The alpha mode for the material. Default is 'OPAQUE'.
     */
    alphaMode?: AlphaMode;
  }

  /**
   * MaterialProps is an interface that defines the properties for creating a Material instance.
   */
  interface MaterialProps {
    /**
     * The name of the material.
     */
    name?: string;
    /**
     * Whether the material is visible from both sides. Default is false.
     */
    doubleSided?: boolean;
    /**
     * The alpha cutoff value for the material. Default is 0.5.
     */
    alphaCutoff?: number;
    /**
     * The alpha mode for the material. Default is 'OPAQUE'.
     */
    alphaMode?: AlphaMode;
    /**
     * The RGBA base color factor.
     */
    baseColorFactor?: ArrayLike<number>;
    /**
     * The base color texture.
     */
    baseColorTexture?: Texture;
    /**
     * The metallic factor. Default is 1.
     */
    metallicFactor?: number;
    /**
     * The roughness factor. Default is 1.
     */
    roughnessFactor?: number;
    /**
     * The metallic-roughness texture.
     */
    metallicRoughnessTexture?: Texture;
    /**
     * The normal texture.
     */
    normalTexture?: Texture;
    /**
     * The scale for the normal texture. Default is 1.
     */
    normalScale?: number;
    /**
     * The occlusion texture.
     */
    occlusionTexture?: Texture;
    /**
     * The occlusion strength. Default is 1.
     */
    occlusionStrength?: number;
    /**
     * The RGB emissive factor.
     */
    emissiveFactor?: ArrayLike<number>;
    /**
     * The emissive texture.
     */
    emissiveTexture?: Texture;
  }

  /**
   * The Material class represents a material in a scene.
   */
  class Material {
    /**
     * Creates a new Material instance.
     * @param props The properties to create the material with.
     */
    constructor(props: MaterialProps);

    /**
     * Returns the base color factor of the Material object as an RGBA instance.
     */
    get baseColorFactor(): RGBA;

    /**
     * Gets the base color texture of the Material object.
     */
    get baseColorTexture(): Texture | undefined;

    /**
     * Sets the base color texture of the Material object.
     * @param texture The new base color texture.
     */
    set baseColorTexture(texture: Texture | undefined);

    /**
     * Gets the metallic factor of the Material object.
     */
    get metallicFactor(): number;

    /**
     * Sets the metallic factor of the Material object.
     * @param value The new metallic factor value.
     */
    set metallicFactor(value: number);

    /**
     * Gets the roughness factor of the Material object.
     */
    get roughnessFactor(): number;

    /**
     * Sets the roughness factor of the Material object.
     * @param value The new roughness factor value.
     */
    set roughnessFactor(value: number);

    /**
     * Returns the emissive factor of the Material object as an RGB instance.
     */
    get emissiveFactor(): RGB;
  }

  /**
   * The Matrix4 class represents a 4x4 matrix of numbers.
   */
  class Matrix4 {
    [n: number]: number;

    /**
     * Sets the elements of the Matrix.
     * @param {ArrayLike<number>} value - The new values for the Matrix4 instance.
     */
    set(value: ArrayLike<number>): this;

    /**
     * Returns the number of elements of the Matrix.
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
     */
    get mode(): MeshPrimitiveMode;

    /**
     * Returns the Accessor for the indices of the mesh primitive.
     */
    get indices(): Accessor | undefined;

    /**
     * Returns the Accessor for the specified attribute name.
     * @param name The attribute name.
     * @returns The Accessor for the attribute or undefined if not found.
     */
    getAttribute(name: MeshPrimitiveAttribute): Accessor | undefined;

    /**
     * Returns the Material of the mesh primitive.
     */
    get material(): Material | undefined;

    /**
     * Sets the Material for the mesh primitive.
     * @param material The Material to set.
     */
    set material(material: Material | undefined);

    /**
     * Sets the draw range for the mesh primitive.
     * @param start The starting index for the draw range.
     * @param count The number of indices in the draw range.
     */
    setDrawRange(start: number, count: number): this;

    /**
     * Enables or disables the hologram material for the mesh primitive.
     * @param enabled Whether to enable or disable the hologram material.
     * @experimental This API is experimental and may change or be removed in future releases.
     */
    thirdroomSetHologramMaterialEnabled(enabled: boolean): this;
  }

  /**
   * MeshProps is an interface for defining properties of a mesh.
   */
  interface MeshProps {
    /**
     * The name of the mesh.
     */
    name?: string;
    /**
     * An array of MeshPrimitiveProps that define the geometry and materials of the mesh.
     */
    primitives: MeshPrimitiveProps[];
  }

  /**
   * BoxMeshProps is an interface for defining properties of a box mesh.
   */
  interface BoxMeshProps {
    /**
     * The size of the mesh in meters in the x,y,z directions.
     */
    size?: ArrayLike<number>;
    /**
     * The number of segments to use in the x,y,z directions.
     */
    segments?: ArrayLike<number>;
    /**
     * The material to use for the mesh.
     */
    material?: Material;
  }

  /**
   * The Mesh class represents a 3D object with one or more mesh primitives.
   */
  class Mesh {
    /**
     * An array of MeshPrimitive instances that define the geometry of the mesh.
     */
    readonly primitives: MeshPrimitive[];
  }

  /**
   * An iterator for node objects.
   */
  class NodeIterator {
    /**
     * Returns the next node in the iterator.
     */
    next(): { value: Node; done: boolean };
    [Symbol.iterator](): NodeIterator;
  }

  /**
   * Interface representing the properties you can create a Node object with.
   */
  interface NodeProps {
    /**
     * The initial name of the node.
     */
    name?: string;

    /**
     * The initial mesh associated with the node.
     */
    mesh?: Mesh;

    /**
     * The initial UI canvas associated with the node.
     */
    uiCanvas?: UICanvas;

    /**
     * The initial translation of the node.
     */
    translation?: Vector3;

    /**
     * The initial rotation of the node.
     */
    rotation?: Quaternion;

    /**
     * The initial scale of the node.
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
     */
    pitch?: number;

    /**
     * The yaw angle in degrees, which is the rotation around the Y-axis.
     * Positive values rotate the camera to the right, while negative values rotate it to the left.
     */
    yaw?: number;

    /**
     * The zoom value, which is a scalar factor for the distance from the object.
     * Positive values move the camera closer to the object, while negative values move it further away.
     */
    zoom?: number;
  }

  /**
   * Class representing a node in a scene graph.
   */
  class Node {
    /**
     * The node's translation as a Vector3.
     */
    readonly translation: Vector3;

    /**
     * The node's rotation as a Quaternion.
     */
    readonly rotation: Quaternion;

    /**
     * The node's scale as a Vector3.
     */
    readonly scale: Vector3;

    /**
     * The node's local transformation matrix as a Matrix4.
     */
    readonly matrix: Matrix4;

    /**
     * The node's world transformation matrix as a ReadonlyMatrix4.
     */
    readonly worldMatrix: ReadonlyMatrix4;

    /**
     * Adds a child node to this node.
     * @param node The node to add as a child.
     */
    addChild(node: Node): this;

    /**
     * Removes a child node from this node.
     * @param node The node to remove.
     */
    removeChild(node: Node): this;

    /**
     * Gets the child node at the specified index or undefined if the index is out of range.
     * @param index The index of the child node.
     */
    getChild(index: number): Node | undefined;

    /**
     * Returns an iterator for the children of this node.
     */
    children(): NodeIterator;

    /**
     * Gets the parent node of this node or undefined if this node has no parent.
     */
    get parent(): Node | undefined;

    /**
     * Gets or sets whether this node is static.
     */
    get isStatic(): boolean;

    /**
     * Sets whether this node is static and can be optimized by the engine.
     * Optimizations include world matrix calculations. When a node is static,
     * you may not modify its transform properties (translation, rotation, scale).
     * @param value Whether this node is static.
     */
    set isStatic(value: boolean);

    /**
     * Returns whether or not this node is visible
     */
    get visible(): boolean;

    /**
     * Sets whether or not this node is visible
     * @param value Whether or not this node is visible
     */
    set visible(value: boolean);

    /**
     * Get the mesh associated with this node.
     */
    get mesh(): Mesh | undefined;

    /**
     * Set the mesh associated with this node.
     * @param mesh The mesh to associate with this node or undefined to unset.
     */
    set mesh(mesh: Mesh | undefined);

    /**
     * Get the light associated with this node.
     */
    get light(): Light | undefined;

    /**
     * Set the light associated with this node.
     * @param light The light to associate with this node or undefined to unset.
     */
    set light(light: Light | undefined);

    /**
     * Get the collider associated with this node.
     */
    get collider(): Collider | undefined;

    /**
     * Set the collider associated with this node.
     * @param collider The collider to associate with this node or undefined to unset.
     */
    set collider(collider: Collider | undefined);

    /**
     * Get the UI canvas associated with this node.
     */
    get uiCanvas(): UICanvas | undefined;

    /**
     * Set the UI canvas associated with this node.
     * @param uiCanvas The UI canvas to associate with this node or undefined to unset.
     */
    set uiCanvas(uiCanvas: UICanvas | undefined);

    /**
     * Gets the interactable behavior associated with this node.
     */
    get interactable(): Interactable | undefined;

    /**
     * Adds an interactable behavior to this node.
     * @param {InteractableProps | undefined} props Optional interactable properties.
     */
    addInteractable(props?: InteractableProps): Interactable;

    /**
     * Removes the interactable property from this node.
     */
    removeInteractable(): undefined;

    /**
     * Gets the physics body behavior associated with this node.
     */
    get physicsBody(): PhysicsBody | undefined;

    /**
     * Adds a physics body behavior to this node.
     * @param {PhysicsBodyProps | undefined} props Optional physics body properties.
     */
    addPhysicsBody(props?: PhysicsBodyProps): PhysicsBody;

    /**
     * Removes the physics body behavior from this node.
     */
    removePhysicsBody(): undefined;

    /**
     * Enables orbit camera control mode for this node.
     * @param options Optional orbit options.
     */
    startOrbit(options?: OrbitOptions): undefined;
    /**
     * Adds a component to this node.
     * @param component the component type to add.
     */
    addComponent(component: ComponentStore): undefined;
    /**
     * Removes a component from this node.
     * @param component the component type to remove.
     */
    removeComponent(component: ComponentStore): undefined;
    /**
     * Checks if this node has a component.
     * @param component the component type to check for.
     */
    hasComponent(component: ComponentStore): boolean;
    /**
     * Gets an instance of a component of the specified type on this node.
     * If the component does not exist on this node, it will return undefined.
     * @param component the component type to get.
     */
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
     */
    type: PhysicsBodyType;

    /**
     * The mass of the physics body in kilograms.
     */
    mass?: number;

    /**
     * The linear velocity of the physics body as an array of three numbers [x, y, z].
     */
    linearVelocity?: ArrayLike<number>;

    /**
     * The angular velocity of the physics body as an array of three numbers [x, y, z].
     */
    angularVelocity?: ArrayLike<number>;

    /**
     * The inertia tensor of the physics body as an array of nine numbers representing a 3x3 matrix.
     * @experimental This property is experimental and may be changed in a future release.
     */
    inertiaTensor?: ArrayLike<number>;
  }

  /**
   * A PhysicsBody is a behavior that can be added to a node to give it a
   * physical presence in the world and interact with other physics bodies.
   */
  class PhysicsBody {
    /**
     * Applies an impulse at the center of mass of this physics body.
     * @param impulse The impulse to apply.
     */
    applyImpulse(impulse: ArrayLike<number>): undefined;
  }

  class Collision {
    /**
     * The first node involved in the collision.
     */
    nodeA: Node;
    /**
     * The second node involved in the collision.
     */
    nodeB: Node;
    /**
     * Whether the collision started or ended this frame.
     */
    started: boolean;
  }

  /**
   * An iterator for collisions.
   */
  class CollisionIterator {
    /**
     * Returns the next collision in the iterator.
     */
    next(): { value: Collision; done: boolean };
    [Symbol.iterator](): CollisionIterator;
  }

  /**
   * A Collision Listener provides an interface for listening to collisions events between nodes with colliders.
   * Collision events are recorded for both the start and end of a collision.
   * {@link WebSG.CollisionListener.collisions | .collisions()} should be called each frame to iterate through
   * the collisions that occurred since the last call to .collisions(). Failing to regularly call .collisions()
   * will result in a memory leak. If you are done listening to collisions, you should call .dispose() to free
   * up the memory used by the collision listener and stop listening to collisions.
   */
  class CollisionListener {
    /**
     * Returns an iterator for the collisions that occurred since the last call to .collisions().
     */
    collisions(): CollisionIterator;
    /**
     * Disposes of the collision listener and stops listening to collisions.
     */
    dispose(): void;
  }

  /**
   * A Quaternion class with x, y, z, and w components. The class provides methods to set the components of the quaternion using an array-like syntax.
   */
  class Quaternion {
    /**
     * The quaternion components.
     */
    [n: number]: number;

    /**
     * The x-component of the quaternion.
     */
    x: number;

    /**
     * The y-component of the quaternion.
     */
    y: number;

    /**
     * The z-component of the quaternion.
     */
    z: number;

    /**
     * The w-component of the quaternion.
     */
    w: number;

    /**
     * Sets the quaternion components to the given values.
     * @param {ArrayLike<number>} value - An array-like object containing the quaternion components.
     */
    set(value: ArrayLike<number>): this;

    /**
     * The number of components in the quaternion.
     */
    readonly length: number;
  }

  /**
   * Class representing an RGB color.
   */
  class RGB {
    /**
     * The RGB color components.
     */
    [n: number]: number;

    /**
     * The red component of the color.
     */
    r: number;

    /**
     * The green component of the color.
     */
    g: number;

    /**
     * The blue component of the color.
     */
    b: number;

    /**
     * Sets the RGB color components to the given values.
     * @param value An array-like object containing the RGB color components.
     */
    set(value: ArrayLike<number>): this;

    /**
     * The number of components in the RGB color.
     */
    readonly length: number;
  }

  /**
   * Class representing an RGBA color.
   */
  class RGBA {
    /**
     * The RGBA color components.
     */
    [n: number]: number;

    /**
     * The red component of the color.
     */
    r: number;

    /**
     * The green component of the color.
     */
    g: number;

    /**
     * The blue component of the color.
     */
    b: number;

    /**
     * The alpha component of the color.
     */
    a: number;

    /**
     * Sets the RGBA color components to the given values.
     * @param value An array-like object containing the RGBA color components.
     */
    set(value: ArrayLike<number>): this;

    /**
     * The number of components in the RGBA color.
     */
    readonly length: number;
  }

  /**
   * Interface representing the properties for a scene.
   */
  interface SceneProps {
    /**
     * Optional name of the scene.
     */
    name?: string;
  }

  /**
   * Class representing the root of a scene graph.
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

  /**
   * A class representing a texture resource.
   */
  class Texture {}

  /**
   * A class representing an image data resource.
   */
  class Image {}

  /**
   * Interface for UIButton properties.
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
   */
  class UIButton extends UIText {
    /**
     * Gets the button label text.
     */
    get label(): string;

    /**
     * Sets the button label text.
     * @param value The button label text.
     */
    set label(value: string);

    /**
     * Returns true if the button was pressed during this frame, otherwise false.
     */
    get pressed(): boolean;

    /**
     * Returns true if the button is held during this frame, otherwise false.
     */
    get held(): boolean;

    /**
     * Returns true if the button was released during this frame, otherwise false.
     */
    get released(): boolean;
  }

  /**
   * Interface for UICanvas properties.
   */
  interface UICanvasProps {
    /**
     * The root UI element of the canvas.
     */
    root?: UIElement;

    /**
     * The canvas width in pixels.
     */
    width?: number;

    /**
     * The canvas height in pixels.
     */
    height?: number;

    /**
     * The canvas size as an array-like object in meters.
     */
    size?: ArrayLike<number>;
  }

  /**
   * A UICanvas is used to render UI elements to a flat plane in the world.
   */
  class UICanvas {
    /**
     * Gets the root UIElement of the canvas.
     */
    get root(): UIElement | undefined;

    /**
     * Sets the root UIElement of the canvas.
     * @param element The root UIElement of the canvas.
     */
    set root(element: UIElement | undefined);

    /**
     * Gets the canvas width in pixels.
     */
    get width(): number;

    /**
     * Sets the canvas width in pixels.
     * @param value The canvas width in pixels.
     */
    set width(value: number);

    /**
     * Gets the canvas height in pixels.
     */
    get height(): number;

    /**
     * Sets the canvas height in pixels.
     * @param value The canvas height in pixels.
     */
    set height(value: number);

    /**
     * Redraws the canvas.
     * This should be called any time the UI elements are changed.
     */
    redraw(): undefined;

    /**
     * Gets the canvas size as a Vector2 in meters.
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

  interface UIElementProps {
    /**
     * The distance from the top edge of the parent element.
     */
    top?: number;
    /**
     * The distance from the right edge of the parent element.
     */
    right?: number;
    /**
     * The distance from the bottom edge of the parent element.
     */
    bottom?: number;
    /**
     * The distance from the left edge of the parent element.
     */
    left?: number;
    /**
     * The position type of the element (ex. "relative" or "absolute").
     */
    position?: ElementPositionType;
    /**
     * The alignment of the element's content.
     */
    alignContent?: FlexAlign;
    /**
     * The alignment of the element's items.
     */
    alignItems?: FlexAlign;
    /**
     * The alignment of the element itself.
     */
    alignSelf?: FlexAlign;
    /**
     * The direction of the flex layout.
     */
    flexDirection?: FlexDirection;
    /**
     * The wrapping behavior of the flex layout.
     */
    flexWrap?: FlexWrap;
    /**
     * The initial size of the element along the main axis.
     */
    flexBasis?: number;
    /**
     * The factor by which the element should grow if there is extra space.
     */
    flexGrow?: number;
    /**
     * The factor by which the element should shrink if there is not enough space.
     */
    flexShrink?: number;
    /**
     * The justification of the element's content.
     */
    justifyContent?: FlexJustify;
    /**
     * The width of the element in pixels.
     */
    width?: number;
    /**
     * The height of the element in pixels.
     */
    height?: number;
    /**
     * The minimum width of the element in pixels.
     */
    minWidth?: number;
    /**
     * The minimum height of the element in pixels.
     */
    minHeight?: number;
    /**
     * The maximum width of the element in pixels.
     */
    maxWidth?: number;
    /**
     * The maximum height of the element in pixels.
     */
    maxHeight?: number;
    /**
     * The background color of the element.
     */
    backgroundColor?: ArrayLike<number>;
    /**
     * The border color of the element.
     */
    borderColor?: ArrayLike<number>;
    /**
     * The padding of the element in pixels.
     */
    padding?: ArrayLike<number>;
    /**
     * The margin of the element in pixels.
     */
    margin?: ArrayLike<number>;
    /**
     * The border width of the element in pixels.
     */
    borderWidth?: ArrayLike<number>;
    /**
     * The border radius of the element in pixels.
     */
    borderRadius?: ArrayLike<number>;
  }

  /**
   * An iterator for UIElement objects.
   */
  class UIElementIterator {
    /**
     * Gets the next UI element in the iterator.
     */
    next(): { value: UIElement; done: boolean };
    [Symbol.iterator](): UIElementIterator;
  }

  /**
   * Class representing a user interface element.
   *
   * Implements the CSS Flexbox layout model.
   * https://css-tricks.com/snippets/css/a-guide-to-flexbox/
   */
  class UIElement {
    /**
     * Gets the position of the UI element.
     */
    get position(): ElementPositionType;

    /**
     * Sets the position of the UI element.
     * @param value The new position type for the UI element.
     */
    set position(value: ElementPositionType);

    /**
     * Gets the top position of the UI element in pixels.
     */
    get top(): number;

    /**
     * Sets the top position of the UI element in pixels.
     * @param value The new top position value for the UI element in pixels.
     */
    set top(value: number);

    /**
     * Gets the right position of the UI element in pixels.
     */
    get right(): number;

    /**
     * Sets the right position of the UI element in pixels.
     * @param value The new right position value for the UI element in pixels.
     */
    set right(value: number);

    /**
     * Gets the bottom position of the UI element in pixels.
     */
    get bottom(): number;

    /**
     * Sets the bottom position of the UI element in pixels.
     * @param value The new bottom position value for the UI element in pixels.
     */
    set bottom(value: number);

    /**
     * Gets the left position of the UI element in pixels.
     */
    get left(): number;

    /**
     * Sets the left position of the UI element in pixels.
     * @param value The new left position value for the UI element in pixels.
     */
    set left(value: number);

    /**
     * Gets the align-content property of the UI element.
     */
    get alignContent(): FlexAlign;

    /**
     * Sets the align-content property of the UI element.
     * @param value The new align-content value for the UI element.
     */
    set alignContent(value: FlexAlign);

    /**
     * Gets the align-items property of the UI element.
     */
    get alignItems(): FlexAlign;

    /**
     * Sets the align-items property of the UI element.
     * @param value The new align-items value for the UI element.
     */
    set alignItems(value: FlexAlign);

    /**
     * Gets the align-self property of the UI element.
     */
    get alignSelf(): FlexAlign;

    /**
     * Sets the align-self property of the UI element.
     * @param value The new align-self value for the UI element.
     */
    set alignSelf(value: FlexAlign);

    /**
     * Gets the flex-direction property of the UI element.
     */
    get flexDirection(): FlexDirection;

    /**
     * Sets the flex-direction property of the UI element.
     * @param value The new flex-direction value for the UI element.
     */
    set flexDirection(value: FlexDirection);

    /**
     * Gets the flex wrap property of the UI element.
     */
    get flexWrap(): FlexWrap;

    /**
     * Sets the flex wrap property of the UI element.
     * @param value The new flex wrap property value.
     */
    set flexWrap(value: FlexWrap);

    /**
     * Gets the flex basis property of the UI element in pixels.
     */
    get flexBasis(): number;

    /**
     * Sets the flex basis property of the UI element in pixels.
     * @param value The new flex basis property value in pixels.
     */
    set flexBasis(value: number);

    /**
     * Gets the flex grow property of the UI element.
     */
    get flexGrow(): number;

    /**
     * Sets the flex grow property of the UI element.
     * @param value The new flex grow property value.
     */
    set flexGrow(value: number);

    /**
     * Gets the flex shrink property of the UI element.
     */
    get flexShrink(): number;

    /**
     * Sets the flex shrink property of the UI element.
     * @param value The new flex shrink property value.
     */
    set flexShrink(value: number);

    /**
     * Gets the justify content property of the UI element.
     */
    get justifyContent(): FlexJustify;

    /**
     * Sets the justify content property of the UI element.
     * @param value The new justify content property value.
     */
    set justifyContent(value: FlexJustify);

    /**
     * Gets the width of the UI element in pixels.
     */
    get width(): number;

    /**
     * Sets the width of the UI element in pixels.
     * @param value The new width of the UI element in pixels.
     */
    set width(value: number);

    /**
     * Gets the height of the UI element in pixels.
     */
    get height(): number;

    /**
     * Sets the height of the UI element in pixels.
     * @param value The new height of the UI element in pixels.
     */
    set height(value: number);

    /**
     * Gets the minimum width of the UI element in pixels.
     */
    get minWidth(): number;

    /**
     * Sets the minimum width of the UI element in pixels.
     * @param value The new minimum width of the UI element in pixels.
     */
    set minWidth(value: number);

    /**
     * Gets the minimum height of the UI element in pixels.
     */
    get minHeight(): number;

    /**
     * Sets the minimum height of the UI element.
     * @param value The new minimum height of the UI element.
     */
    set minHeight(value: number);

    /**
     * Gets the maximum width of the UI element.
     */
    get maxWidth(): number;

    /**
     * Sets the maximum width of the UI element in pixels.
     * @param value The new maximum width of the UI element in pixels.
     */
    set maxWidth(value: number);

    /**
     * Gets the maximum height of the UI element in pixels.
     */
    get maxHeight(): number;

    /**
     * Sets the maximum height of the UI element in pixels.
     * @param value The new maximum height of the UI element.
     */
    set maxHeight(value: number);

    /**
     * Adds a child UI element to the current element.
     * @param element The child UI element to add.
     */
    addChild(element: UIElement): this;

    /**
     * Removes a child UI element from the current element.
     * @param element The child UI element to remove.
     */
    removeChild(element: UIElement): this;

    /**
     * Gets the child UI element at the specified index or undefined if the index is out of bounds.
     * @param index The index of the child UI element.
     */
    getChild(index: number): UIElement | undefined;

    /**
     * Returns an iterator for the children of the current UI element.
     */
    children(): UIElementIterator;

    /**
     * Gets the parent UI element of the current element or undefined if the element has no parent.
     */
    get parent(): UIElement | undefined;

    /**
     * Gets the {@link WebSG.ElementType | type} of the UI element.
     */
    get type(): ElementType;

    /**
     * Readonly RGBA object representing the background color of the UI element.
     */
    readonly backgroundColor: RGBA;

    /**
     * Readonly RGBA object representing the border color of the UI element.
     */
    readonly borderColor: RGBA;

    /**
     * Readonly Vector4 object representing the padding of the UI element.
     */
    readonly padding: Vector4;

    /**
     * Readonly Vector4 object representing the margin of the UI element.
     */
    readonly margin: Vector4;

    /**
     * Readonly Vector4 object representing the border width of the UI element.
     */
    readonly borderWidth: Vector4;

    /**
     * Readonly Vector4 object representing the border radius of the UI element.
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
     */
    value?: string;

    /**
     * The font family used for the text.
     * Any valid css font-family property value is allowed.
     */
    fontFamily?: string;

    /**
     * The font style used for the text, e.g. 'normal' or 'italic'.
     * Any valid css font-style property value is allowed.
     */
    fontStyle?: string;

    /**
     * The font weight used for the text, e.g. 'normal', 'bold', or a numeric value.
     * Any valid css font-weight property value is allowed.
     */
    fontWeight?: string;

    /**
     * The color of the text as an array-like structure of [r, g, b, a] values, where each value is in the range [0, 1].
     */
    color?: ArrayLike<number>;

    /**
     * The font size of the text in pixels.
     */
    fontSize?: number;
  }

  /**
   * Class representing a text element within a user interface.
   */
  class UIText extends UIElement {
    /**
     * Gets the text content of the UIText element.
     */
    get value(): string;

    /**
     * Sets the text content of the UIText element.
     * @param value The new text content.
     */
    set value(value: string);

    /**
     * Gets the font family used for the text.
     */
    get fontFamily(): string;

    /**
     * Sets the font family used for the text.
     * @param value The new font family. Accepts any valid CSS font-family value.
     */
    set fontFamily(value: string);

    /**
     * Gets the font weight used for the text.
     */
    get fontWeight(): string;

    /**
     * Sets the font weight used for the text.
     * @param value The new font weight. Accepts any valid CSS font-weight value.
     */
    set fontWeight(value: string);

    /**
     * Gets the font size of the text in pixels.
     */
    get fontSize(): number;

    /**
     * Sets the font size of the text in pixels.
     * @param value The new font size. Accepts any valid CSS font-size value.
     */
    set fontSize(value: number);

    /**
     * Gets the font style used for the text.
     */
    get fontStyle(): string;

    /**
     * Sets the font style used for the text.
     * @param value The new font style.  Accepts any valid CSS font-style value.
     */
    set fontStyle(value: string);

    /**
     * Readonly property representing the color of the text as an RGBA object.
     */
    readonly color: RGBA;
  }

  /**
   * A 2-dimensional vector.
   */
  class Vector2 {
    [index: number]: number;
    /**
     * The x component of the vector.
     */
    x: number;
    /**
     * The y component of the vector.
     */
    y: number;
    /**
     * Constructs a new vector.
     */
    constructor();
    /**
     * Constructs a new vector with the given components.
     * @param x The x component.
     * @param y The y component.
     */
    constructor(x: number, y: number);
    /**
     * Constructs and sets the initial components of the vector from a numeric array-like object.
     */
    constructor(array: ArrayLike<number>);
    /**
     * Sets the components of the vector.
     * @param value The x,y components of the vector.
     */
    set(value: ArrayLike<number>): this;
    /**
     * Sets the components of the vector to a scalar value.
     */
    setScalar(value: number): this;
    /**
     * Adds the given vector to this vector.
     * @param vector The vector to add.
     */
    add(vector: ArrayLike<number>): this;
    /**
     * Adds the given vectors together and stores the result in this vector.
     * @param a The first vector.
     * @param b The second vector.
     */
    addVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    /**
     * Adds the given vector scaled by the given scalar to this vector.
     */
    addScaledVector(vector: ArrayLike<number>, scale: number): this;
    /**
     * Subtracts the given vector from this vector.
     * @param vector The vector to subtract.
     */
    subtract(vector: ArrayLike<number>): this;
    /**
     * Subtracts the second vector from the first and stores the result in this vector.
     * @param a The first vector.
     * @param b The second vector.
     */
    subtractVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    /**
     * Subtracts the given vector scaled by the given scalar from this vector.
     * @param vector The vector to subtract.
     * @param scale The scalar to scale the vector by.
     */
    subtractScaledVector(vector: ArrayLike<number>, scale: number): this;
    /**
     * Multiplies this vector by the given vector.
     * @param vector The vector to multiply by.
     */
    multiply(vector: ArrayLike<number>): this;
    /**
     * Multiplies the given vectors together and stores the result in this vector.
     * @param a The first vector.
     * @param b The second vector.
     */
    multiplyVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    /**
     * Multiplies this vector by the given scalar.
     * @param scalar The scalar to multiply by.
     */
    multiplyScalar(scalar: number): this;
    /**
     * Divides this vector by the given vector.
     * @param vector The vector to divide by.
     */
    divide(vector: ArrayLike<number>): this;
    /**
     * Divides the given vectors and stores the result in this vector.
     * @param a The first vector.
     * @param b The second vector.
     */
    divideVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    /**
     * Divides this vector by the given scalar.
     * @param scalar The scalar to divide by.
     */
    divideScalar(scalar: number): this;
    /**
     * Returns the number of components in this vector.
     */
    readonly length: number;
  }

  /**
   * A 3-dimensional vector.
   */
  class Vector3 {
    [index: number]: number;
    /**
     * The x component of the vector.
     */
    x: number;
    /**
     * The y component of the vector.
     */
    y: number;
    /**
     * The z component of the vector.
     */
    z: number;
    constructor();
    /**
     * Constructs and sets the initial components of the vector.
     * @param x The x component of the vector.
     * @param y The y component of the vector.
     * @param z The z component of the vector.
     */
    constructor(x: number, y: number, z: number);
    /**
     * Constructs and sets the initial components of the vector from a numeric array-like object.
     */
    constructor(array: ArrayLike<number>);
    /**
     * Sets the components of the vector.
     * @param value The x,y,z components of the vector.
     */
    set(value: ArrayLike<number>): this;
    /**
     * Sets the components of the vector to the given scalar value.
     * @param value The scalar value to set.
     */
    setScalar(value: number): this;
    /**
     * Adds the given vector to this vector.
     * @param vector The vector to add.
     */
    add(vector: ArrayLike<number>): this;
    /**
     * Adds two vectors together and stores the result in this vector.
     * @param a The first vector.
     * @param b The second vector.
     */
    addVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    /**
     * Adds the given vector scaled by the given scalar to this vector.
     */
    addScaledVector(vector: ArrayLike<number>, scale: number): this;
    /**
     * Subtracts the given vector from this vector.
     * @param vector The vector to subtract.
     */
    subtract(vector: ArrayLike<number>): this;
    /**
     * Subtracts the second vector from the first and stores the result in this vector.
     * @param a The first vector.
     * @param b The second vector.
     */
    subtractVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    /**
     * Subtracts the given vector scaled by the given scalar from this vector.
     * @param vector The vector to subtract.
     * @param scale The scalar to scale the vector by before subtracting.
     */
    subtractScaledVector(vector: ArrayLike<number>, scale: number): this;
    /**
     * Multiplies this vector by the given vector.
     * @param vector The vector to multiply by.
     */
    multiply(vector: ArrayLike<number>): this;
    /**
     * Multiplies two vectors together and stores the result in this vector.
     * @param a The first vector.
     * @param b The second vector.
     */
    multiplyVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    /**
     * Multiplies this vector by the given scalar.
     * @param scalar The scalar to multiply by.
     */
    multiplyScalar(scalar: number): this;
    /**
     * Divides this vector by the given vector.
     * @param vector The vector to divide by.
     */
    divide(vector: ArrayLike<number>): this;
    /**
     * Divides the first vector by the second and stores the result in this vector.
     * @param a The first vector.
     * @param b The second vector.
     */
    divideVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    /**
     * Divides this vector by the given scalar.
     * @param scalar The scalar to divide by.
     */
    divideScalar(scalar: number): this;
    /**
     * Returns the number of components in this vector.
     */
    readonly length: number;
  }

  /**
   * A 4-dimensional vector.
   */
  class Vector4 {
    [index: number]: number;
    /**
     * The x component of the vector.
     */
    x: number;
    /**
     * The y component of the vector.
     */
    y: number;
    /**
     * The z component of the vector.
     */
    z: number;
    /**
     * The w component of the vector.
     */
    w: number;
    /**
     * Alias for {@link WebSG.Vector4.x}
     */
    top: number;
    /**
     * Alias for {@link WebSG.Vector4.y}
     */
    right: number;
    /**
     * Alias for {@link WebSG.Vector4.z}
     */
    bottom: number;
    /**
     * Alias for {@link WebSG.Vector4.w}
     */
    left: number;
    /**
     * Constructs a new vector.
     */
    constructor();
    /**
     * Constructs a new vector with the given components.
     * @param x The x component of the vector.
     * @param y The y component of the vector.
     * @param z The z component of the vector.
     * @param w The w component of the vector.
     */
    constructor(x: number, y: number, z: number, w: number);
    /**
     * Constructs and sets the initial components of the vector from a numeric array-like object.
     */
    constructor(array: ArrayLike<number>);
    /**
     * Sets the components of the vector.
     * @param value The x,y,z,w components of the vector.
     */
    set(value: ArrayLike<number>): this;
    /**
     * Sets the components of the vector to a scalar value.
     * @param value The value to set the components to.
     */
    setScalar(value: number): this;
    /**
     * Adds a vector to this vector.
     * @param vector The vector to add.
     */
    add(vector: ArrayLike<number>): this;
    /**
     * Adds two vectors together and stores the result in this vector.
     * @param a The first vector.
     * @param b The second vector.
     */
    addVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    /**
     * Adds a scaled vector to this vector.
     * @param vector The vector to add.
     * @param scale The scale to apply to the vector.
     */
    addScaledVector(vector: ArrayLike<number>, scale: number): this;
    /**
     * Subtracts a vector from this vector.
     * @param vector The vector to subtract.
     */
    subtract(vector: ArrayLike<number>): this;
    /**
     * Subtracts two vectors and stores the result in this vector.
     * @param a The first vector.
     * @param b The second vector.
     */
    subtractVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    /**
     * Subtracts a scaled vector from this vector.
     * @param vector The vector to subtract.
     * @param scale The scale to apply to the vector.
     */
    subtractScaledVector(vector: ArrayLike<number>, scale: number): this;
    /**
     * Multiplies this vector by another vector.
     * @param vector The vector to multiply.
     */
    multiply(vector: ArrayLike<number>): this;
    /**
     * Multiplies two vectors together and stores the result in this vector.
     * @param a The first vector.
     * @param b The second vector.
     */
    multiplyVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    /**
     * Multiplies this vector by a scalar value.
     * @param scalar The scalar to multiply by.
     */
    multiplyScalar(scalar: number): this;
    /**
     * Divides this vector by another vector.
     * @param vector The vector to divide by.
     */
    divide(vector: ArrayLike<number>): this;
    /**
     * Divides two vectors and stores the result in this vector.
     * @param a The first vector.
     * @param b The second vector.
     */
    divideVectors(a: ArrayLike<number>, b: ArrayLike<number>): this;
    /**
     * Divides this vector by a scalar value.
     * @param scalar The scalar to divide by.
     */
    divideScalar(scalar: number): this;
    /**
     * Returns the number of components in this vector.
     */
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
     */
    get environment(): Scene;

    /**
     * Sets the environment of the world.
     * @param {Scene} scene The new environment scene for the world.
     */
    set environment(scene: Scene);

    /**
     * Creates an {@link WebSG.Accessor | Accessor } from the given ArrayBuffer and properties.
     * @param {ArrayBuffer} buffer The ArrayBuffer to create the Accessor from.
     * @param {AccessorFromProps} props The properties for the new Accessor.
     */
    createAccessorFrom(buffer: ArrayBuffer, props: AccessorFromProps): Accessor;

    /**
     * Finds an {@link WebSG.Accessor | Accessor } by its name. Returns undefined if not found.
     * @param name - The name of the Accessor to find.
     */
    findAccessorByName(name: string): Accessor | undefined;

    /**
     * Creates a {@link WebSG.Collider | Collider } with the given properties.
     * @param {ColliderProps} props The properties for the new Collider.
     */
    createCollider(props: ColliderProps): Collider;

    /**
     * Finds a {@link WebSG.Collider | Collider } by its name. Returns undefined if not found.
     * @param name The name of the Collider to find.
     */
    findColliderByName(name: string): Collider | undefined;

    /**
     * Creates a {@link WebSG.Light | Light } with the given properties.
     * @param props The properties for the new Light.
     */
    createLight(props: LightProps): Light;

    /**
     * Finds a {@link WebSG.Light | Light } by its name. Returns undefined if not found.
     * @param name The name of the Light to find.
     */
    findLightByName(name: string): Light | undefined;

    /**
     * Creates an unlit {@link WebSG.Material | Material } with the given properties.
     * @param props The properties for the new unlit Material.
     */
    createUnlitMaterial(props: UnlitMaterialProps): Material;

    /**
     * Creates a {@link WebSG.Material | Material } with the given properties.
     * @param props The properties for the new Material.
     */
    createMaterial(props: MaterialProps): Material;

    /**
     * Finds a {@link WebSG.Material | Material } by its name. Returns undefined if not found.
     * @param name The name of the Material to find.
     */
    findMaterialByName(name: string): Material | undefined;

    /**
     * Creates a {@link WebSG.Mesh | Mesh } with the given properties.
     * @param props The properties for the new Mesh.
     */
    createMesh(props: MeshProps): Mesh;

    /**
     * Creates a Box {@link WebSG.Mesh | Mesh } with the given properties.
     * @param props The properties for the new Box Mesh.
     */
    createBoxMesh(props: BoxMeshProps): Mesh;

    /**
     * Finds a {@link WebSG.Mesh | Mesh } by its name. Returns undefined if not found.
     * @param name The name of the mesh to find.
     */
    findMeshByName(name: string): Mesh | undefined;

    /**
     * Creates a new {@link WebSG.Node | Node } with the given properties.
     * @param props Optional properties to set on the new node.
     */
    createNode(props?: NodeProps): Node;

    /**
     * Finds a {@link WebSG.Node | node } by its name. Returns undefined if not found.
     * @param name The name of the node to find.
     */
    findNodeByName(name: string): Node | undefined;

    /**
     * Creates a new {@link WebSG.Scene | Scene } with the given properties.
     * @param props Optional properties to set on the new scene.
     */
    createScene(props?: SceneProps): Scene;

    /**
     * Finds a {@link WebSG.Scene | scene } by its name. Returns undefined if not found.
     * @param name The name of the scene to find.
     */
    findSceneByName(name: string): Scene | undefined;

    /**
     * Finds a {@link WebSG.Texture | texture } by its name. Returns undefined if not found.
     * @param name The name of the texture to find.
     */
    findTextureByName(name: string): Texture | undefined;

    /**
     * Finds an {@link WebSG.Image | image } by its name. Returns undefined if not found.
     * @param name The name of the image to find.
     */
    findImageByName(name: string): Image | undefined;

    /**
     * Creates a new {@link WebSG.UICanvas | UICanvas } with the given properties.
     * @param props Optional properties to set on the new UICanvas.
     */
    createUICanvas(props?: UICanvasProps): UICanvas;

    /**
     * Finds a UICanvas by its name. Returns undefined if not found.
     * @param name The name of the UICanvas to find.
     */
    findUICanvasByName(name: string): UICanvas | undefined;

    /**
     * Creates a new UIElement with the given properties.
     * @param props Optional properties to set on the new UIElement.
     */
    createUIElement(props?: UIElementProps): UIElement;

    /**
     * Creates a new UIText with the given properties.
     * @method createUIText
     * @param props Optional properties to set on the new UIText.
     */
    createUIText(props?: UITextProps): UIText;

    /**
     * Creates a new UIButton with the given properties.
     * @param props Optional properties to set on the new UIButton.
     */
    createUIButton(props?: UIButtonProps): UIButton;

    /**
     * Finds a UIElement by its name. Returns undefined if not found.
     * @param name The name of the UIElement to find.
     */
    findUIElementByName(name: string): UIElement | undefined;

    /**
     * Creates a new {@link WebSG.CollisionListener | CollisionListener } for listening to
     * collisions between nodes with colliders set on them.
     */
    createCollisionListener(): CollisionListener;

    /**
     * Returns the maximum number of components per type that can be stored in the world.
     * Defaults to 10000.
     */
    get componentStoreSize(): number;

    /**
     * Sets the maximum number of components per type that can be stored in the world.
     * Defaults to 10000.
     */
    set componentStoreSize(value: number);

    /**
     * Find the {@link WebSG.ComponentStore | ComponentStore } for the given component type.
     * Returns undefined if not found.
     * @param name The name of the component store to find.
     */
    findComponentStoreByName(name: string): ComponentStore | undefined;

    /**
     * Stops any ongoing orbiting operation.
     */
    stopOrbit(): undefined;

    /**
     * Get the primary input source's origin in world space.
     * The primary input source in XR is the user's primary controller otherwise it's the camera.
     * @experimental This API is experimental and may change or be removed in a future release.
     */
    get primaryInputSourceOrigin(): Vector3;

    /**
     * Get the primary input source's direction in world space.
     * The primary input source in XR is the user's primary controller otherwise it's the camera.
     * @experimental This API is experimental and may change or be removed in a future release.
     */
    get primaryInputSourceDirection(): Vector3;

    /**
     * Called when the world is loaded.
     * The glTF document has been loaded and all resources are available.
     */
    onload: (() => any) | null;

    /**
     * Called when the user enters the world.
     * The network.local peer has been set and the user has been spawned into the world.
     */
    onenter: (() => any) | null;

    /**
     * Called once per frame when the world is updated.
     * @param dt - The time since the last update in seconds.
     * @param time - The total time since the start of the world in seconds.
     */
    onupdate: ((dt: number, time: number) => any) | null;
  }
}

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

  /**
   * An iterator for {@link WebSGNetworking.NetworkMessage | NetworkMessage }s.
   */
  class NetworkMessageIterator {
    /**
     * Returns the next {@link WebSGNetworking.NetworkMessage} in the iterator.
     */
    next(): { value: NetworkMessage; done: boolean };
    [Symbol.iterator](): NetworkMessageIterator;
  }

  /**
   * A listener for receiving network messages. The {@link WebSGNetworking.NetworkListener.receive | receive }
   * method should be called once per frame to drain the listener's internal message queue. When done with the
   * listener, the {@link WebSGNetworking.NetworkListener.close | close } method should be called to free
   * the listener's resources.
   */
  class NetworkListener {
    /**
     * This method returns an iterator that can be used to iterate over inbound network messages.
     * @param buffer - An optional buffer to use when reading network messages.
     * This should be at least the size of the largest network message you intend to receive.
     * If not provided, the buffer will be created internally.
     */
    receive(buffer?: ArrayBuffer): NetworkMessageIterator;

    /**
     * Closes the listener and frees its resources.
     */
    close(): undefined;
  }

  /**
   * An object representing a node that was spawned or despawned.
   */
  interface Replication {
    /**
     * The node that was spawned or despawned.
     */
    node: WebSG.Node;
    /**
     * The peer that spawned or despawned the node.
     */
    peer: WebSGNetworking.Peer;
    /**
     * The data that was sent with the spawn or despawn message.
     */
    data: ArrayBuffer;
  }

  /**
   * An iterator for {@link WebSGNetworking.Replication | Replication }s.
   */
  class ReplicationIterator {
    /**
     * Returns the next {@link WebSGNetworking.Replication} in the iterator.
     */
    next(): { value: Replication; done: boolean };
    [Symbol.iterator](): ReplicationIterator;
  }

  /**
   * A replicator for spawning and despawning nodes.
   */
  class Replicator {
    /**
     * Spawns a node with the given optional data.
     * @param data - Optional data to send with the spawn message.
     */
    spawn(data?: ArrayBuffer): WebSG.Node;
    /**
     * Despawns a node with the given optional data.
     * @param node The node to despawn.
     * @param data - Optional data to send with the despawn message.
     */
    despawn(node: WebSG.Node, data?: ArrayBuffer): void;
    /**
     * Returns an iterator for spawned nodes.
     */
    spawned(): ReplicationIterator;
    /**
     * Returns an iterator for despawned nodes.
     */
    despawned(): ReplicationIterator;
  }

  /**
   * Represents the networking methods available
   * for sending and receiving data in a WebSG script.
   */
  class Network {
    /**
     * The current host {@link WebSGNetworking.Peer} in the world. This may change
     * as peers enter and exit the world.
     */
    get host(): Peer | undefined;

    /**
     * The local user's {@link WebSGNetworking.Peer} in the world. This will not be set
     * until the user has entered the world and {@link WebSG.World.onenter | world.onenter} is called
     */
    get local(): Peer | undefined;

    /**
     * Creates a new ${@link WebSGNetworking.NetworkListener} that can be used to listen for
     * incoming messages from other peers.
     */
    listen(): NetworkListener;

    /**
     * Broadcasts data to all connected clients.
     * @param data - The data to be broadcasted.
     * @param reliable - Whether or not the data should be sent reliably or unreliably.
     * Defaults to true.
     */
    broadcast(message: string | ArrayBuffer, reliable?: boolean): undefined;

    /**
     * Callback for when a peer enters the world.
     * @param peer - The peer that entered the world.
     */
    onpeerentered: ((peer: Peer) => any) | null;

    /**
     * Callback for when a peer exits the world.
     * @param peer - The peer that exited the world.
     */
    onpeerexited: ((peer: Peer) => any) | null;

    /**
     * Defines a new replicator that can be used to spawn and despawn nodes
     * @param factory - A function called whenever a new node is spawned.
     */
    defineReplicator(factory: () => WebSG.Node): Replicator;
  }
}

declare namespace ThirdRoom {
  /**
   * An ActionBarListener is used to listen for actions triggered in the action bar.
   * The {@link ThirdRoom.ActionBarListener.actions | .actions()} method should be called
   * each frame to drain the action bar's action queue. If you are done with the action queue,
   * call {@link ThirdRoom.ActionBarListener.dispose | .dispose()} to dispose the listener.
   */
  class ActionBarListener {
    /**
     * Returns an iterator over the actions triggered in the action bar since the last call to this method.
     */
    actions(): ActionBarIterator;

    /**
     * Disposes the action bar listener.
     */
    dispose(): undefined;
  }

  /**
   * Represents an iterator over the actions triggered in the action bar.
   */
  class ActionBarIterator {
    next(): { value: string; done: boolean };
    [Symbol.iterator](): ActionBarIterator;
  }

  /**
   * Represents an item in the action bar.
   */
  interface ActionBarItem {
    /**
     * Used to identify the action when it is triggered.
     */
    id: string;
    /**
     * Used to display what the action does when hovering over an action.
     */
    label: string;
    /**
     * Used to display an icon in the action bar.
     * Note that the thumbnail must be a square uncompressed image (e.g. .png or .jpg)
     * Basis Universal compressed images (e.g. .ktx2) are not supported.
     */
    thumbnail: WebSG.Image;
  }

  /**
   * Represents the action bar at the bottom of the screen.
   * Items can be set via the {@link ThirdRoom.ActionBar.setItems} method.
   * You can listen for triggered actions by creating a new listener via the
   * {@link ThirdRoom.ActionBar.createListener} method.
   */
  class ActionBar {
    /**
     * Replaces the items in the action bar with the given items.
     * @param items The {@link ThirdRoom.ActionBarItem}s to set.
     */
    setItems(items: ActionBarItem[]): undefined;
    /**
     * Creates a new {@link ThirdRoom.ActionBarListener} for the action bar.
     */
    createListener(): ActionBarListener;
  }

  class ThirdRoom {
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
     * The data array must be at least the size returned by getAudioDataSize.
     * Similar to the WebAudio [AnalyserNode.getByteTimeDomainData](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteTimeDomainData)
     * @param {Uint8Array} data - The array to store the audio time data.
     * @returns {number} - The number of elements filled in the data array.
     */
    getAudioTimeData(data: Float32Array): number;

    /**
     * Gets the local audio input source's frequency data and fills the provided Uint8Array.
     * The data array must be at least the size returned by getAudioDataSize.
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
}

declare namespace Matrix {
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
}

/**
 * The global world instance.
 */
declare const world: WebSG.World;

/**
 * The global network instance.
 */
declare const network: WebSGNetworking.Network;

/**
 * The global Matrix widget API instance.
 * @global {MatrixWidgetAPI} matrix
 */
declare const matrix: Matrix.MatrixWidgetAPI;

/**
 * The global ThirdRoom instance.
 * @global {ThirdRoom} thirdroom
 */
declare const thirdroom: ThirdRoom.ThirdRoom;
