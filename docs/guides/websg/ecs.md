# ECS

ECS stands for Entity Component System. It's a design pattern often used in game development that promotes flexibility and performance. In ECS:

- **Entities** are identifiers for game objects.
- **Components** are raw data for different aspects of the game object, such as position or health.
- **Systems** are logic that transforms components from one state to another.

## Defining Components

Components can be defined in the glTF file using the `MX_components` extension.

This can be accomplished using Unity3D with the accompanying ThirdRoom plugin, and creating a class that inherits from `ThirdroomComponent`, like so:

```c#
using UnityEngine;

public class TestComponent : ThirdroomComponent {
  public float value = 1.25;
}
```

Once a component has been defined in the glTF, it can be accessed in the script via `world.findComponentStoreByName`.

```js
const TestComponent = world.findComponentStoreByName("TestComponent");
```

Components can be added, removed, retrieved, and existence checked on any `node`.

```js
const node = world.createNode();

node.addComponent(TestComponent);

console.log(node.hasComponent(TestComponent)); // true

const testComponent = node.getComponent(TestComponent);

console.log(testComponent.value); // 1.25

node.removeComponent(TestComponent);

console.log(node.hasComponent(TestComponent)); // false
```

## Queries

Queries can be used to obtain lists of nodes with certain components.

```js
const testQuery = world.createQuery([TestComponent]);

function TestComponentSystem(time) {
  for (const node of testQuery) {
    const test = node.getComponent(TestComponent);
    test.value += 1;
    console.log(test.value); // 2.25
  }
}
```
