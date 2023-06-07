# Materials

`Material` objects represent a material in a scene which are attached to mesh primitives. They define the appearance of a surface when rendered. This includes properties like color, texture, shininess, transparency, and more.

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

## Unlit and Lit Materials

In many 3D graphics systems, materials can be either "lit" or "unlit". Lit materials are affected by lights in the scene, while an unlit material is not. A lit material is created by calling `world.createMaterial`. To create unlit materials, `world.createUnlitMaterial` can be used.

```typescript
// Create a new UnlitMaterial object
const material = world.createUnlitMaterial({
  baseColorFactor: [1, 1, 1, 1],
});

// The material will now not be affected by lights in the scene
```

## Material Properties

Materials have many properties that can be used to control the appearance of a surface. Here are a few examples:

- `baseColorFactor`: This is a `Color` object representing the base color of the material.
- `metallicFactor`: This is a number representing the metallicness of the material.
- `roughnessFactor`: This is a number representing the roughness of the material.
- `emissiveFactor`: This is a `Color` object representing the color of the light emitted by the material.

```typescript
// Create a new Material object
const material = world.createMaterial();

// Set some properties of the material
material.baseColorFactor = [1, 0, 0, 1]; // Red color
material.metallicFactor = 1; // Fully metallic
material.roughnessFactor = 0; // Completely smooth
material.emissiveFactor = [0, 0, 1, 1]; // Blue light
```
