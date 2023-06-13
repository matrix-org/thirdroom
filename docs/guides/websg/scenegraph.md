# Scene Graph

WebSG is, first and foremost, a scene graph API. A scene graph is a structured representation of a visual scene. It organizes objects in a hierarchical manner, capturing their relationships and attributes, such as relative positions and sizes. This allows for more efficient rendering, manipulation, and understanding of complex visual data.

## Environment

The `world.environment` object is the root `scene` of the chosen glTF document for the currently loaded world. It provides a way to control and manipulate the environmental properties of the 3D world, and can have nodes attached to it.

## Adding and Removing Nodes

The `environment` has methods to add and remove `Node` objects from the scene.

```typescript
// Create a new Node object
const node = world.createNode();

// Add the node to the scene
world.environment.addNode(node);

// Later, you can remove the node from the scene
world.environment.removeNode(node);
```

The `Node` object also has methods to add and remove children from nodes themselves. This allows you to build a hierarchy of nodes, aka a scene graph.

```typescript
// Create a new Node object
const parentNode = world.createNode();
const childNode = world.createNode();

// Add the child node to the parent node
parentNode.addChild(childNode);

// Later, you can remove the child node from the parent node
parentNode.removeChild(childNode);
```

## Static Objects

The `isStatic` property of the `Node` is a boolean that indicates whether the node is static. If a node is static, it means that it does not move or change over time. This can be useful for optimization purposes, as static nodes can be treated differently by the rendering and physics systems.

::: info
Nodes are **not** static by default.
:::

```typescript
// Create a new Node object
let node = world.createNode();

// Set the node to be static
node.isStatic = true;

// Later, you can check if the node is static
if (node.isStatic) {
  console.log("The node is static.");
} else {
  console.log("The node is not static.");
}
```
