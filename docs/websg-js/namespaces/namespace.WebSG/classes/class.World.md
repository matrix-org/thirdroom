# World

**`Class`**

Class representing a 3D world composed of [scenes](class.Scene.md), [nodes](class.Node.md),
[meshes](class.Mesh.md), [materials](class.Material.md), and other properties defined by
the [glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).

Currently a World contains resources loaded for the environment's glTF document. This means you do not have direct
access to user's avatars in the world's scene graph. On script initialization, the world will be empty. It is not
until [world.onload](class.World.md#onload) is called that [world.environment](class.World.md#environment)
will be set to the default [scene](class.Scene.md) in the world's initial glTF document. All other resources
such as textures, materials, and meshes referenced by the document will be loaded at this time and can be accessed
via methods such as [world.findNodeByName ](class.World.md#findnodebyname).

## Example

In the following example [world.findNodeByName ](class.World.md#findnodebyname) is used to
find a [node ](class.Node.md) by its name and log the reference to the console.

```js
// World not yet loaded

world.onload = () => {
  // World loaded
  const lightNode = world.findNodeByName("Light");
  console.log(lightNode);
};
```

Once a world is loaded you can modify the scene graph by adding, removing, or modifying nodes.

## Example

```js
world.onload = () => {
  const newNode = world.createNode();
  world.environment.addNode(newNode); // Nodes must be added to a scene to be rendered

  newNode.mesh = world.findMeshByName("Teapot");

  world.environment.removeNode(newNode);
};
```

If you want to modify the scene graph each frame you can use the
[world.onupdate](class.World.md#onupdate) callback.

## Example

```js
world.onload = () => {
  const newNode = world.createNode();
  world.environment.addNode(newNode);

  newNode.mesh = world.findMeshByName("Teapot");

  world.onupdate = (dt, time) => {
    newNode.translation.y = Math.sin(time) * 5;
  };
};
```

Once the local user has entered the world, the networking interface will be fully initialized. You access
the local user's [peer](../../namespace.WebSGNetworking/classes/class.Peer.md) via the global
[network.local](../../namespace.WebSGNetworking/classes/class.Network.md) variable. This can be used to get the local user's transform.

## Example

```js
world.onenter = () => {
  const localUser = network.local;
  console.log(localUser.transform);
  console.log(localUser.rotation);
};
```

Overall, world is the main interface for creating new resources. See the individual factory functions
for more details.

**Source:** [websg.d.ts:2268](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2268)

## Constructors

### constructor()

> **new World**(): [`World`](class.World.md)

#### Returns

[`World`](class.World.md)

## Properties

### onenter

> **onenter**: `null` \| () => `any`

Called when the user enters the world.
The network.local peer has been set and the user has been spawned into the world.

**Source:** [websg.d.ts:2481](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2481)

### onload

> **onload**: `null` \| () => `any`

Called when the world is loaded.
The glTF document has been loaded and all resources are available.

**Source:** [websg.d.ts:2475](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2475)

### onupdate

> **onupdate**: `null` \| (dt: `number`, time: `number`) => `any`

Called once per frame when the world is updated.

#### Param

The time since the last update in seconds.

#### Param

The total time since the start of the world in seconds.

**Source:** [websg.d.ts:2488](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2488)

## Accessors

### componentStoreSize

> get **componentStoreSize()**: `number`

**Source:** [websg.d.ts:2437](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2437) [websg.d.ts:2443](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2443)

### environment

> get **environment()**: [`Scene`](class.Scene.md)

**Source:** [websg.d.ts:2273](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2273) [websg.d.ts:2279](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2279)

### primaryInputSourceDirection

> get **primaryInputSourceDirection()**: [`Vector3`](class.Vector3.md)

**Source:** [websg.d.ts:2469](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2469)

### primaryInputSourceOrigin

> get **primaryInputSourceOrigin()**: [`Vector3`](class.Vector3.md)

**Source:** [websg.d.ts:2462](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2462)

## Methods

### createAccessorFrom()

> **createAccessorFrom**(buffer: `ArrayBuffer`, props: [`AccessorFromProps`](../interfaces/interface.AccessorFromProps.md)): [`Accessor`](class.Accessor.md)

Creates an [Accessor ](class.Accessor.md) from the given ArrayBuffer and properties.

**Source:** [websg.d.ts:2286](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2286)

#### Parameters

| Parameter | Type                                                                | Description                                  |
| :-------- | :------------------------------------------------------------------ | :------------------------------------------- |
| buffer    | `ArrayBuffer`                                                       | The ArrayBuffer to create the Accessor from. |
| props     | [`AccessorFromProps`](../interfaces/interface.AccessorFromProps.md) | The properties for the new Accessor.         |

#### Returns

[`Accessor`](class.Accessor.md)

### createBoxMesh()

> **createBoxMesh**(props: [`BoxMeshProps`](../interfaces/interface.BoxMeshProps.md)): [`Mesh`](class.Mesh.md)

Creates a Box [Mesh ](class.Mesh.md) with the given properties.

**Source:** [websg.d.ts:2346](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2346)

#### Parameters

| Parameter | Type                                                      | Description                          |
| :-------- | :-------------------------------------------------------- | :----------------------------------- |
| props     | [`BoxMeshProps`](../interfaces/interface.BoxMeshProps.md) | The properties for the new Box Mesh. |

#### Returns

[`Mesh`](class.Mesh.md)

### createCollider()

> **createCollider**(props: [`ColliderProps`](../interfaces/interface.ColliderProps.md)): [`Collider`](class.Collider.md)

Creates a [Collider ](class.Collider.md) with the given properties.

**Source:** [websg.d.ts:2298](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2298)

#### Parameters

| Parameter | Type                                                        | Description                          |
| :-------- | :---------------------------------------------------------- | :----------------------------------- |
| props     | [`ColliderProps`](../interfaces/interface.ColliderProps.md) | The properties for the new Collider. |

#### Returns

[`Collider`](class.Collider.md)

### createCollisionListener()

> **createCollisionListener**(): [`CollisionListener`](class.CollisionListener.md)

Creates a new [CollisionListener ](class.CollisionListener.md) for listening to
collisions between nodes with colliders set on them.

**Source:** [websg.d.ts:2431](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2431)

#### Returns

[`CollisionListener`](class.CollisionListener.md)

### createLight()

> **createLight**(props: [`LightProps`](../interfaces/interface.LightProps.md)): [`Light`](class.Light.md)

Creates a [Light ](class.Light.md) with the given properties.

**Source:** [websg.d.ts:2310](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2310)

#### Parameters

| Parameter | Type                                                  | Description                       |
| :-------- | :---------------------------------------------------- | :-------------------------------- |
| props     | [`LightProps`](../interfaces/interface.LightProps.md) | The properties for the new Light. |

#### Returns

[`Light`](class.Light.md)

### createMaterial()

> **createMaterial**(props: [`MaterialProps`](../interfaces/interface.MaterialProps.md)): [`Material`](class.Material.md)

Creates a [Material ](class.Material.md) with the given properties.

**Source:** [websg.d.ts:2328](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2328)

#### Parameters

| Parameter | Type                                                        | Description                          |
| :-------- | :---------------------------------------------------------- | :----------------------------------- |
| props     | [`MaterialProps`](../interfaces/interface.MaterialProps.md) | The properties for the new Material. |

#### Returns

[`Material`](class.Material.md)

### createMesh()

> **createMesh**(props: [`MeshProps`](../interfaces/interface.MeshProps.md)): [`Mesh`](class.Mesh.md)

Creates a [Mesh ](class.Mesh.md) with the given properties.

**Source:** [websg.d.ts:2340](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2340)

#### Parameters

| Parameter | Type                                                | Description                      |
| :-------- | :-------------------------------------------------- | :------------------------------- |
| props     | [`MeshProps`](../interfaces/interface.MeshProps.md) | The properties for the new Mesh. |

#### Returns

[`Mesh`](class.Mesh.md)

### createNode()

> **createNode**(props?: [`NodeProps`](../interfaces/interface.NodeProps.md)): [`Node`](class.Node.md)

Creates a new [Node ](class.Node.md) with the given properties.

**Source:** [websg.d.ts:2358](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2358)

#### Parameters

| Parameter | Type                                                | Description                                 |
| :-------- | :-------------------------------------------------- | :------------------------------------------ |
| props?    | [`NodeProps`](../interfaces/interface.NodeProps.md) | Optional properties to set on the new node. |

#### Returns

[`Node`](class.Node.md)

### createScene()

> **createScene**(props?: [`SceneProps`](../interfaces/interface.SceneProps.md)): [`Scene`](class.Scene.md)

Creates a new [Scene ](class.Scene.md) with the given properties.

**Source:** [websg.d.ts:2370](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2370)

#### Parameters

| Parameter | Type                                                  | Description                                  |
| :-------- | :---------------------------------------------------- | :------------------------------------------- |
| props?    | [`SceneProps`](../interfaces/interface.SceneProps.md) | Optional properties to set on the new scene. |

#### Returns

[`Scene`](class.Scene.md)

### createUIButton()

> **createUIButton**(props?: [`UIButtonProps`](../interfaces/interface.UIButtonProps.md)): [`UIButton`](class.UIButton.md)

Creates a new UIButton with the given properties.

**Source:** [websg.d.ts:2419](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2419)

#### Parameters

| Parameter | Type                                                        | Description                                     |
| :-------- | :---------------------------------------------------------- | :---------------------------------------------- |
| props?    | [`UIButtonProps`](../interfaces/interface.UIButtonProps.md) | Optional properties to set on the new UIButton. |

#### Returns

[`UIButton`](class.UIButton.md)

### createUICanvas()

> **createUICanvas**(props?: [`UICanvasProps`](../interfaces/interface.UICanvasProps.md)): [`UICanvas`](class.UICanvas.md)

Creates a new [UICanvas ](class.UICanvas.md) with the given properties.

**Source:** [websg.d.ts:2394](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2394)

#### Parameters

| Parameter | Type                                                        | Description                                     |
| :-------- | :---------------------------------------------------------- | :---------------------------------------------- |
| props?    | [`UICanvasProps`](../interfaces/interface.UICanvasProps.md) | Optional properties to set on the new UICanvas. |

#### Returns

[`UICanvas`](class.UICanvas.md)

### createUIElement()

> **createUIElement**(props?: [`UIElementProps`](../interfaces/interface.UIElementProps.md)): [`UIElement`](class.UIElement.md)

Creates a new UIElement with the given properties.

**Source:** [websg.d.ts:2406](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2406)

#### Parameters

| Parameter | Type                                                          | Description                                      |
| :-------- | :------------------------------------------------------------ | :----------------------------------------------- |
| props?    | [`UIElementProps`](../interfaces/interface.UIElementProps.md) | Optional properties to set on the new UIElement. |

#### Returns

[`UIElement`](class.UIElement.md)

### createUIText()

> **createUIText**(props?: [`UITextProps`](../interfaces/interface.UITextProps.md)): [`UIText`](class.UIText.md)

Creates a new UIText with the given properties.

#### Method

createUIText

**Source:** [websg.d.ts:2413](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2413)

#### Parameters

| Parameter | Type                                                    | Description                                   |
| :-------- | :------------------------------------------------------ | :-------------------------------------------- |
| props?    | [`UITextProps`](../interfaces/interface.UITextProps.md) | Optional properties to set on the new UIText. |

#### Returns

[`UIText`](class.UIText.md)

### createUnlitMaterial()

> **createUnlitMaterial**(props: [`UnlitMaterialProps`](../interfaces/interface.UnlitMaterialProps.md)): [`Material`](class.Material.md)

Creates an unlit [Material ](class.Material.md) with the given properties.

**Source:** [websg.d.ts:2322](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2322)

#### Parameters

| Parameter | Type                                                                  | Description                                |
| :-------- | :-------------------------------------------------------------------- | :----------------------------------------- |
| props     | [`UnlitMaterialProps`](../interfaces/interface.UnlitMaterialProps.md) | The properties for the new unlit Material. |

#### Returns

[`Material`](class.Material.md)

### findAccessorByName()

> **findAccessorByName**(name: `string`): `undefined` \| [`Accessor`](class.Accessor.md)

Finds an [Accessor ](class.Accessor.md) by its name. Returns undefined if not found.

**Source:** [websg.d.ts:2292](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2292)

#### Parameters

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| name      | `string` | The name of the Accessor to find. |

#### Returns

`undefined` \| [`Accessor`](class.Accessor.md)

### findColliderByName()

> **findColliderByName**(name: `string`): `undefined` \| [`Collider`](class.Collider.md)

Finds a [Collider ](class.Collider.md) by its name. Returns undefined if not found.

**Source:** [websg.d.ts:2304](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2304)

#### Parameters

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| name      | `string` | The name of the Collider to find. |

#### Returns

`undefined` \| [`Collider`](class.Collider.md)

### findComponentStoreByName()

> **findComponentStoreByName**(name: `string`): `undefined` \| [`ComponentStore`](class.ComponentStore.md)

Find the [ComponentStore ](class.ComponentStore.md) for the given component type.
Returns undefined if not found.

**Source:** [websg.d.ts:2450](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2450)

#### Parameters

| Parameter | Type     | Description                              |
| :-------- | :------- | :--------------------------------------- |
| name      | `string` | The name of the component store to find. |

#### Returns

`undefined` \| [`ComponentStore`](class.ComponentStore.md)

### findImageByName()

> **findImageByName**(name: `string`): `undefined` \| [`Image`](class.Image.md)

Finds an [image ](class.Image.md) by its name. Returns undefined if not found.

**Source:** [websg.d.ts:2388](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2388)

#### Parameters

| Parameter | Type     | Description                    |
| :-------- | :------- | :----------------------------- |
| name      | `string` | The name of the image to find. |

#### Returns

`undefined` \| [`Image`](class.Image.md)

### findLightByName()

> **findLightByName**(name: `string`): `undefined` \| [`Light`](class.Light.md)

Finds a [Light ](class.Light.md) by its name. Returns undefined if not found.

**Source:** [websg.d.ts:2316](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2316)

#### Parameters

| Parameter | Type     | Description                    |
| :-------- | :------- | :----------------------------- |
| name      | `string` | The name of the Light to find. |

#### Returns

`undefined` \| [`Light`](class.Light.md)

### findMaterialByName()

> **findMaterialByName**(name: `string`): `undefined` \| [`Material`](class.Material.md)

Finds a [Material ](class.Material.md) by its name. Returns undefined if not found.

**Source:** [websg.d.ts:2334](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2334)

#### Parameters

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| name      | `string` | The name of the Material to find. |

#### Returns

`undefined` \| [`Material`](class.Material.md)

### findMeshByName()

> **findMeshByName**(name: `string`): `undefined` \| [`Mesh`](class.Mesh.md)

Finds a [Mesh ](class.Mesh.md) by its name. Returns undefined if not found.

**Source:** [websg.d.ts:2352](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2352)

#### Parameters

| Parameter | Type     | Description                   |
| :-------- | :------- | :---------------------------- |
| name      | `string` | The name of the mesh to find. |

#### Returns

`undefined` \| [`Mesh`](class.Mesh.md)

### findNodeByName()

> **findNodeByName**(name: `string`): `undefined` \| [`Node`](class.Node.md)

Finds a [node ](class.Node.md) by its name. Returns undefined if not found.

**Source:** [websg.d.ts:2364](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2364)

#### Parameters

| Parameter | Type     | Description                   |
| :-------- | :------- | :---------------------------- |
| name      | `string` | The name of the node to find. |

#### Returns

`undefined` \| [`Node`](class.Node.md)

### findSceneByName()

> **findSceneByName**(name: `string`): `undefined` \| [`Scene`](class.Scene.md)

Finds a [scene ](class.Scene.md) by its name. Returns undefined if not found.

**Source:** [websg.d.ts:2376](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2376)

#### Parameters

| Parameter | Type     | Description                    |
| :-------- | :------- | :----------------------------- |
| name      | `string` | The name of the scene to find. |

#### Returns

`undefined` \| [`Scene`](class.Scene.md)

### findTextureByName()

> **findTextureByName**(name: `string`): `undefined` \| [`Texture`](class.Texture.md)

Finds a [texture ](class.Texture.md) by its name. Returns undefined if not found.

**Source:** [websg.d.ts:2382](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2382)

#### Parameters

| Parameter | Type     | Description                      |
| :-------- | :------- | :------------------------------- |
| name      | `string` | The name of the texture to find. |

#### Returns

`undefined` \| [`Texture`](class.Texture.md)

### findUICanvasByName()

> **findUICanvasByName**(name: `string`): `undefined` \| [`UICanvas`](class.UICanvas.md)

Finds a UICanvas by its name. Returns undefined if not found.

**Source:** [websg.d.ts:2400](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2400)

#### Parameters

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| name      | `string` | The name of the UICanvas to find. |

#### Returns

`undefined` \| [`UICanvas`](class.UICanvas.md)

### findUIElementByName()

> **findUIElementByName**(name: `string`): `undefined` \| [`UIElement`](class.UIElement.md)

Finds a UIElement by its name. Returns undefined if not found.

**Source:** [websg.d.ts:2425](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2425)

#### Parameters

| Parameter | Type     | Description                        |
| :-------- | :------- | :--------------------------------- |
| name      | `string` | The name of the UIElement to find. |

#### Returns

`undefined` \| [`UIElement`](class.UIElement.md)

### stopOrbit()

> **stopOrbit**(): `undefined`

Stops any ongoing orbiting operation.

**Source:** [websg.d.ts:2455](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2455)

#### Returns

`undefined`
