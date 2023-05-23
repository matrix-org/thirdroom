[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / World

# Class: World

[WebSG](../modules/WebSG.md).World

Class representing a 3D world composed of [scenes](WebSG.Scene.md), [nodes](WebSG.Node.md),
[meshes](WebSG.Mesh.md), [materials](WebSG.Material.md), and other properties defined by
the [glTF 2.0 specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html).

Currently a World contains resources loaded for the environment's glTF document. This means you do not have direct
access to user's avatars in the world's scene graph. On script initialization, the world will be empty. It is not
until [world.onload](WebSG.World.md#onload) is called that [world.environment](WebSG.World.md#environment)
will be set to the default [scene](WebSG.Scene.md) in the world's initial glTF document. All other resources
such as textures, materials, and meshes referenced by the document will be loaded at this time and can be accessed
via methods such as [world.findNodeByName ](WebSG.World.md#findnodebyname).

**`Example`**

In the following example [world.findNodeByName](WebSG.World.md#findnodebyname) is used to
find a [node](WebSG.Node.md) by its name and log the reference to the console.
```js
// World not yet loaded

world.onload = () => {
  // World loaded
  const lightNode = world.findNodeByName("Light");
  console.log(lightNode);
};
```

Once a world is loaded you can modify the scene graph by adding, removing, or modifying nodes.

**`Example`**

```js
world.onload = () => {
  const newNode = world.createNode();
  world.environment.addNode(newNode); // Nodes must be added to a scene to be rendered

  newNode.mesh = world.findMeshByName("Teapot");

  world.environment.removeNode(newNode);
};
```

If you want to modify the scene graph each frame you can use the
[world.onupdate](WebSG.World.md#onupdate) callback.

**`Example`**

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
the local user's [peer](WebSGNetworking.Peer.md) via the global
[network.local](WebSGNetworking.Network.md) variable. This can be used to get the local user's transform.

**`Example`**

```js
world.onenter = () => {
  const localUser = network.local;
  console.log(localUser.transform);
  console.log(localUser.rotation);
};
```

Overall, world is the main interface for creating new resources. See the individual factory functions
for more details.

## Table of contents

### Constructors

- [constructor](WebSG.World.md#constructor)

### Properties

- [environment](WebSG.World.md#environment)
- [onenter](WebSG.World.md#onenter)
- [onload](WebSG.World.md#onload)
- [onupdate](WebSG.World.md#onupdate)

### Accessors

- [componentStoreSize](WebSG.World.md#componentstoresize)
- [primaryInputSourceDirection](WebSG.World.md#primaryinputsourcedirection)
- [primaryInputSourceOrigin](WebSG.World.md#primaryinputsourceorigin)

### Methods

- [createAccessorFrom](WebSG.World.md#createaccessorfrom)
- [createBoxMesh](WebSG.World.md#createboxmesh)
- [createCollider](WebSG.World.md#createcollider)
- [createCollisionListener](WebSG.World.md#createcollisionlistener)
- [createLight](WebSG.World.md#createlight)
- [createMaterial](WebSG.World.md#creatematerial)
- [createMesh](WebSG.World.md#createmesh)
- [createNode](WebSG.World.md#createnode)
- [createScene](WebSG.World.md#createscene)
- [createUIButton](WebSG.World.md#createuibutton)
- [createUICanvas](WebSG.World.md#createuicanvas)
- [createUIElement](WebSG.World.md#createuielement)
- [createUIText](WebSG.World.md#createuitext)
- [createUnlitMaterial](WebSG.World.md#createunlitmaterial)
- [findAccessorByName](WebSG.World.md#findaccessorbyname)
- [findColliderByName](WebSG.World.md#findcolliderbyname)
- [findComponentStoreByName](WebSG.World.md#findcomponentstorebyname)
- [findImageByName](WebSG.World.md#findimagebyname)
- [findLightByName](WebSG.World.md#findlightbyname)
- [findMaterialByName](WebSG.World.md#findmaterialbyname)
- [findMeshByName](WebSG.World.md#findmeshbyname)
- [findNodeByName](WebSG.World.md#findnodebyname)
- [findSceneByName](WebSG.World.md#findscenebyname)
- [findTextureByName](WebSG.World.md#findtexturebyname)
- [findUICanvasByName](WebSG.World.md#finduicanvasbyname)
- [findUIElementByName](WebSG.World.md#finduielementbyname)
- [stopOrbit](WebSG.World.md#stoporbit)

## Constructors

### constructor

• **new World**()

## Properties

### environment

• **environment**: [`Scene`](WebSG.Scene.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:37](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L37)

___

### onenter

• **onenter**: ``null`` \| () => `any`

Called when the user enters the world.
The network.local peer has been set and the user has been spawned into the world.

#### Defined in

[packages/websg-types/types/websg.d.ts:2484](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2484)

___

### onload

• **onload**: ``null`` \| () => `any`

Called when the world is loaded.
The glTF document has been loaded and all resources are available.

#### Defined in

[packages/websg-types/types/websg.d.ts:2478](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2478)

___

### onupdate

• **onupdate**: ``null`` \| (`dt`: `number`, `time`: `number`) => `any`

Called once per frame when the world is updated.

**`Param`**

The time since the last update in seconds.

**`Param`**

The total time since the start of the world in seconds.

#### Defined in

[packages/websg-types/types/websg.d.ts:2491](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2491)

## Accessors

### componentStoreSize

• `get` **componentStoreSize**(): `number`

Returns the maximum number of components per type that can be stored in the world.
Defaults to 10000.

#### Returns

`number`

#### Defined in

[packages/websg-types/types/websg.d.ts:2440](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2440)

• `set` **componentStoreSize**(`value`): `void`

Sets the maximum number of components per type that can be stored in the world.
Defaults to 10000.

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `number` |

#### Returns

`void`

#### Defined in

[packages/websg-types/types/websg.d.ts:2446](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2446)

___

### primaryInputSourceDirection

• `get` **primaryInputSourceDirection**(): [`Vector3`](WebSG.Vector3.md)

Get the primary input source's direction in world space.
The primary input source in XR is the user's primary controller otherwise it's the camera.
 This API is experimental and may change or be removed in a future release.

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2472](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2472)

___

### primaryInputSourceOrigin

• `get` **primaryInputSourceOrigin**(): [`Vector3`](WebSG.Vector3.md)

Get the primary input source's origin in world space.
The primary input source in XR is the user's primary controller otherwise it's the camera.
 This API is experimental and may change or be removed in a future release.

#### Returns

[`Vector3`](WebSG.Vector3.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2465](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2465)

## Methods

### createAccessorFrom

▸ **createAccessorFrom**(`buffer`, `props`): [`Accessor`](WebSG.Accessor.md)

Creates a new accessor from the given buffer and properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `buffer` | `ArrayBuffer` | The buffer to create the accessor from. |
| `props` | `AccessorProps` | An object containing properties to set on the accessor. |

#### Returns

[`Accessor`](WebSG.Accessor.md)

The newly created accessor.

#### Defined in

[src/engine/scripting/websg-api.d.ts:126](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L126)

▸ **createAccessorFrom**(`buffer`, `props`): [`Accessor`](WebSG.Accessor.md)

Creates an [Accessor ](WebSG.Accessor.md) from the given ArrayBuffer and properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `buffer` | `ArrayBuffer` | The ArrayBuffer to create the Accessor from. |
| `props` | [`AccessorFromProps`](../interfaces/WebSG.AccessorFromProps.md) | The properties for the new Accessor. |

#### Returns

[`Accessor`](WebSG.Accessor.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2289](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2289)

___

### createBoxMesh

▸ **createBoxMesh**(`props?`): [`Mesh`](WebSG.Mesh.md)

Creates a new box mesh with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`BoxMeshProps`](../interfaces/WebSG.BoxMeshProps.md) | An optional object containing properties to set on the box mesh. |

#### Returns

[`Mesh`](WebSG.Mesh.md)

The newly created box mesh.

#### Defined in

[src/engine/scripting/websg-api.d.ts:77](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L77)

▸ **createBoxMesh**(`props`): [`Mesh`](WebSG.Mesh.md)

Creates a Box [Mesh ](WebSG.Mesh.md) with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`BoxMeshProps`](../interfaces/WebSG.BoxMeshProps.md) | The properties for the new Box Mesh. |

#### Returns

[`Mesh`](WebSG.Mesh.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2349](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2349)

___

### createCollider

▸ **createCollider**(`props`): [`Collider`](WebSG.Collider.md)

Creates a new collider with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`ColliderProps`](../interfaces/WebSG.ColliderProps.md) | An object containing properties to set on the collider. |

#### Returns

[`Collider`](WebSG.Collider.md)

The newly created collider.

#### Defined in

[src/engine/scripting/websg-api.d.ts:85](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L85)

▸ **createCollider**(`props`): [`Collider`](WebSG.Collider.md)

Creates a [Collider ](WebSG.Collider.md) with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`ColliderProps`](../interfaces/WebSG.ColliderProps.md) | The properties for the new Collider. |

#### Returns

[`Collider`](WebSG.Collider.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2301](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2301)

___

### createCollisionListener

▸ **createCollisionListener**(): [`CollisionListener`](WebSG.CollisionListener.md)

Creates a new [CollisionListener ](WebSG.CollisionListener.md) for listening to
collisions between nodes with colliders set on them.

#### Returns

[`CollisionListener`](WebSG.CollisionListener.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2434](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2434)

___

### createLight

▸ **createLight**(`props`): [`Light`](WebSG.Light.md)

Creates a [Light ](WebSG.Light.md) with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`LightProps`](../interfaces/WebSG.LightProps.md) | The properties for the new Light. |

#### Returns

[`Light`](WebSG.Light.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2313](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2313)

___

### createMaterial

▸ **createMaterial**(`props`): [`Material`](WebSG.Material.md)

Creates a [Material ](WebSG.Material.md) with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`MaterialProps`](../interfaces/WebSG.MaterialProps.md) | The properties for the new Material. |

#### Returns

[`Material`](WebSG.Material.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2331](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2331)

___

### createMesh

▸ **createMesh**(`primitives`): [`Mesh`](WebSG.Mesh.md)

Creates a new mesh with the given primitive(s).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `primitives` | [`MeshPrimitiveProps`](../interfaces/WebSG.MeshPrimitiveProps.md)[] | An array of mesh primitive properties to set on the mesh. |

#### Returns

[`Mesh`](WebSG.Mesh.md)

The newly created mesh.

#### Defined in

[src/engine/scripting/websg-api.d.ts:134](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L134)

▸ **createMesh**(`props`): [`Mesh`](WebSG.Mesh.md)

Creates a [Mesh ](WebSG.Mesh.md) with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`MeshProps`](../interfaces/WebSG.MeshProps.md) | The properties for the new Mesh. |

#### Returns

[`Mesh`](WebSG.Mesh.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2343](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2343)

___

### createNode

▸ **createNode**(`props?`): [`Node`](WebSG.Node.md)

Creates a new node with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`NodeProps`](../interfaces/WebSG.NodeProps.md) | An optional object containing properties to set on the node. |

#### Returns

[`Node`](WebSG.Node.md)

The newly created node.

#### Defined in

[src/engine/scripting/websg-api.d.ts:69](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L69)

▸ **createNode**(`props?`): [`Node`](WebSG.Node.md)

Creates a new [Node ](WebSG.Node.md) with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`NodeProps`](../interfaces/WebSG.NodeProps.md) | Optional properties to set on the new node. |

#### Returns

[`Node`](WebSG.Node.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2361](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2361)

___

### createScene

▸ **createScene**(`props?`): [`Scene`](WebSG.Scene.md)

Creates a new [Scene ](WebSG.Scene.md) with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`SceneProps`](../interfaces/WebSG.SceneProps.md) | Optional properties to set on the new scene. |

#### Returns

[`Scene`](WebSG.Scene.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2373](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2373)

___

### createUIButton

▸ **createUIButton**(`props`): [`UIButton`](WebSG.UIButton.md)

Creates a new UI button element with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`UIButtonProps`](../interfaces/WebSG.UIButtonProps.md) | An object containing properties to set on the UI button element. |

#### Returns

[`UIButton`](WebSG.UIButton.md)

The newly created UI button element.

#### Defined in

[src/engine/scripting/websg-api.d.ts:117](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L117)

▸ **createUIButton**(`props?`): [`UIButton`](WebSG.UIButton.md)

Creates a new UIButton with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`UIButtonProps`](../interfaces/WebSG.UIButtonProps.md) | Optional properties to set on the new UIButton. |

#### Returns

[`UIButton`](WebSG.UIButton.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2422](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2422)

___

### createUICanvas

▸ **createUICanvas**(`props`): [`UICanvas`](WebSG.UICanvas.md)

Creates a new UI canvas with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`UICanvasProps`](../interfaces/WebSG.UICanvasProps.md) | An object containing properties to set on the UI canvas. |

#### Returns

[`UICanvas`](WebSG.UICanvas.md)

The newly created UI canvas.

#### Defined in

[src/engine/scripting/websg-api.d.ts:93](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L93)

▸ **createUICanvas**(`props?`): [`UICanvas`](WebSG.UICanvas.md)

Creates a new [UICanvas ](WebSG.UICanvas.md) with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`UICanvasProps`](../interfaces/WebSG.UICanvasProps.md) | Optional properties to set on the new UICanvas. |

#### Returns

[`UICanvas`](WebSG.UICanvas.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2397](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2397)

___

### createUIElement

▸ **createUIElement**(`props`): [`UIElement`](WebSG.UIElement.md)

Creates a new UI element with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`UIElementProps`](../interfaces/WebSG.UIElementProps.md) | An object containing properties to set on the UI element. |

#### Returns

[`UIElement`](WebSG.UIElement.md)

The newly created UI element.

#### Defined in

[src/engine/scripting/websg-api.d.ts:101](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L101)

▸ **createUIElement**(`props?`): [`UIElement`](WebSG.UIElement.md)

Creates a new UIElement with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`UIElementProps`](../interfaces/WebSG.UIElementProps.md) | Optional properties to set on the new UIElement. |

#### Returns

[`UIElement`](WebSG.UIElement.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2409](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2409)

___

### createUIText

▸ **createUIText**(`props`): [`UIText`](WebSG.UIText.md)

Creates a new UI text element with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`UITextProps`](../interfaces/WebSG.UITextProps.md) | An object containing properties to set on the UI text element. |

#### Returns

[`UIText`](WebSG.UIText.md)

The newly created UI text element.

#### Defined in

[src/engine/scripting/websg-api.d.ts:109](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L109)

▸ **createUIText**(`props?`): [`UIText`](WebSG.UIText.md)

Creates a new UIText with the given properties.

**`Method`**

createUIText

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`UITextProps`](../interfaces/WebSG.UITextProps.md) | Optional properties to set on the new UIText. |

#### Returns

[`UIText`](WebSG.UIText.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2416](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2416)

___

### createUnlitMaterial

▸ **createUnlitMaterial**(`props`): [`Material`](WebSG.Material.md)

Creates an unlit [Material ](WebSG.Material.md) with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`UnlitMaterialProps`](../interfaces/WebSG.UnlitMaterialProps.md) | The properties for the new unlit Material. |

#### Returns

[`Material`](WebSG.Material.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2325](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2325)

___

### findAccessorByName

▸ **findAccessorByName**(`name`): `undefined` \| [`Accessor`](WebSG.Accessor.md)

Finds an [Accessor ](WebSG.Accessor.md) by its name. Returns undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the Accessor to find. |

#### Returns

`undefined` \| [`Accessor`](WebSG.Accessor.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2295](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2295)

___

### findColliderByName

▸ **findColliderByName**(`name`): `undefined` \| [`Collider`](WebSG.Collider.md)

Finds a [Collider ](WebSG.Collider.md) by its name. Returns undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the Collider to find. |

#### Returns

`undefined` \| [`Collider`](WebSG.Collider.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2307](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2307)

___

### findComponentStoreByName

▸ **findComponentStoreByName**(`name`): `undefined` \| [`ComponentStore`](WebSG.ComponentStore.md)

Find the [ComponentStore ](WebSG.ComponentStore.md) for the given component type.
Returns undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the component store to find. |

#### Returns

`undefined` \| [`ComponentStore`](WebSG.ComponentStore.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2453](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2453)

___

### findImageByName

▸ **findImageByName**(`name`): `undefined` \| [`Image`](WebSG.Image.md)

Finds an [image ](WebSG.Image.md) by its name. Returns undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the image to find. |

#### Returns

`undefined` \| [`Image`](WebSG.Image.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2391](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2391)

___

### findLightByName

▸ **findLightByName**(`name`): `undefined` \| [`Light`](WebSG.Light.md)

Finds a [Light ](WebSG.Light.md) by its name. Returns undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the Light to find. |

#### Returns

`undefined` \| [`Light`](WebSG.Light.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2319](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2319)

___

### findMaterialByName

▸ **findMaterialByName**(`name`): `undefined` \| [`Material`](WebSG.Material.md)

Searches for a material by name and returns it if found, or undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the material to search for. |

#### Returns

`undefined` \| [`Material`](WebSG.Material.md)

The found material or undefined if not found.

#### Defined in

[src/engine/scripting/websg-api.d.ts:61](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L61)

▸ **findMaterialByName**(`name`): `undefined` \| [`Material`](WebSG.Material.md)

Finds a [Material ](WebSG.Material.md) by its name. Returns undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the Material to find. |

#### Returns

`undefined` \| [`Material`](WebSG.Material.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2337](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2337)

___

### findMeshByName

▸ **findMeshByName**(`name`): `undefined` \| [`Mesh`](WebSG.Mesh.md)

Searches for a mesh by name and returns it if found, or undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the mesh to search for. |

#### Returns

`undefined` \| [`Mesh`](WebSG.Mesh.md)

The found mesh or undefined if not found.

#### Defined in

[src/engine/scripting/websg-api.d.ts:53](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L53)

▸ **findMeshByName**(`name`): `undefined` \| [`Mesh`](WebSG.Mesh.md)

Finds a [Mesh ](WebSG.Mesh.md) by its name. Returns undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the mesh to find. |

#### Returns

`undefined` \| [`Mesh`](WebSG.Mesh.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2355](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2355)

___

### findNodeByName

▸ **findNodeByName**(`name`): `undefined` \| [`Node`](WebSG.Node.md)

Searches for a node by name and returns it if found, or undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the node to search for. |

#### Returns

`undefined` \| [`Node`](WebSG.Node.md)

The found node or undefined if not found.

#### Defined in

[src/engine/scripting/websg-api.d.ts:45](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L45)

▸ **findNodeByName**(`name`): `undefined` \| [`Node`](WebSG.Node.md)

Finds a [node ](WebSG.Node.md) by its name. Returns undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the node to find. |

#### Returns

`undefined` \| [`Node`](WebSG.Node.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2367](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2367)

___

### findSceneByName

▸ **findSceneByName**(`name`): `undefined` \| [`Scene`](WebSG.Scene.md)

Finds a [scene ](WebSG.Scene.md) by its name. Returns undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the scene to find. |

#### Returns

`undefined` \| [`Scene`](WebSG.Scene.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2379](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2379)

___

### findTextureByName

▸ **findTextureByName**(`name`): `undefined` \| [`Texture`](WebSG.Texture.md)

Finds a [texture ](WebSG.Texture.md) by its name. Returns undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the texture to find. |

#### Returns

`undefined` \| [`Texture`](WebSG.Texture.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2385](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2385)

___

### findUICanvasByName

▸ **findUICanvasByName**(`name`): `undefined` \| [`UICanvas`](WebSG.UICanvas.md)

Finds a UICanvas by its name. Returns undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the UICanvas to find. |

#### Returns

`undefined` \| [`UICanvas`](WebSG.UICanvas.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2403](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2403)

___

### findUIElementByName

▸ **findUIElementByName**(`name`): `undefined` \| [`UIElement`](WebSG.UIElement.md)

Finds a UIElement by its name. Returns undefined if not found.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the UIElement to find. |

#### Returns

`undefined` \| [`UIElement`](WebSG.UIElement.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2428](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2428)

___

### stopOrbit

▸ **stopOrbit**(): `void`

Stops orbiting

#### Returns

`void`

#### Defined in

[src/engine/scripting/websg-api.d.ts:139](https://github.com/thirdroom/thirdroom/blob/972fa72b/src/engine/scripting/websg-api.d.ts#L139)

▸ **stopOrbit**(): `undefined`

Stops any ongoing orbiting operation.

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2458](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L2458)
