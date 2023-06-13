# Meshes

`Mesh` objects represent 3D objects with one or more mesh primitives. Each primitive defines geometry that can be drawn with a material.

```typescript
// Create a new Mesh object
const mesh = world.createMesh();

// You can then create a node with the new mesh
const node = world.createNode({
  mesh: mesh,
});

// Alternatively, you can set the mesh after creation
node.mesh = mesh;
```

## Accessor

The `Accessor` class provides a way to read and write to a given `ArrayBuffer`. Accessors are used to programatically construct mesh primitives.

```typescript
// Assuming you have a ArrayBuffer object
const arrayBuffer = new ArrayBuffer(1024);

// Create a new Accessor object
const accessor = world.createAccessorFrom(arrayBuffer, WebSG.AccessorType.SCALAR, WebSG.ComponentType.FLOAT, 128);

// You can then use the Accessor to read and write data
const value = accessor.getScalar(0);
accessor.setScalar(0, value + 1);
```

## Primitives

The `MeshPrimitive` object represents a single geometric primitive, which is used to create a `Mesh`. Many primitivess can be added to a mesh. Each primitive has a mode, an `Accessor` for the vertex positions, and optionally accessors for other attributes such as normals, colors, and texture coordinates.

The `Mode` type represents the type of primitive to render. It can be one of the following: `POINTS`, `LINES`, `LINE_LOOP`, `LINE_STRIP`, `TRIANGLES`, `TRIANGLE_STRIP`, `TRIANGLE_FAN`.

```typescript
// Create a new MeshPrimitive object
const primitive = {
  mode: WebSG.MeshPrimitiveMode.TRIANGLES,
  indices: world.createAccessorFrom(indices.buffer, {
    componentType: WebSG.AccessorComponentType.Uint16,
    count: indicesCount,
    type: WebSG.AccessorType.SCALAR,
  }),
  attributes: {
    POSITION: world.createAccessorFrom(positions.buffer, {
      componentType: WebSG.AccessorComponentType.Float32,
      count: positionsCount,
      type: WebSG.AccessorType.VEC3,
      dynamic: true,
    }),
    NORMAL: world.createAccessorFrom(normals.buffer, {
      componentType: WebSG.AccessorComponentType.Float32,
      count: normalsCount,
      type: WebSG.AccessorType.VEC3,
      normalized: true,
      dynamic: true,
    }),
    TEXCOORD_0: world.createAccessorFrom(uvs.buffer, {
      componentType: WebSG.AccessorComponentType.Float32,
      count: uvsCount,
      type: WebSG.AccessorType.VEC2,
    }),
  },
};

// You can then add the primitive to a mesh
const mesh = world.createMesh({
  primitives: [primitive],
});
```

## Materials

`Material` objects represent materials in a scene. It defines the appearance of a surface when rendered. This includes properties like color, texture, shininess, transparency, and more.

```typescript
// Create a new Material object
const material = world.createMaterial({
  baseColorFactor: [1, 0, 0, 1], // aRGB Red color
  metallicFactor: 1, // Fully metallic
  roughnessFactor: 0, // Completely smooth
});

// You can then set the material of a MeshPrimitive
mesh.primitives[0].material = material;
```
