[websg-types](../README.md) / [Exports](../modules.md) / [WebSG](../modules/WebSG.md) / World

# Class: World

[WebSG](../modules/WebSG.md).World

Class representing a 3D world.

## Table of contents

### Constructors

- [constructor](WebSG.World.md#constructor)

### Properties

- [environment](WebSG.World.md#environment)
- [onenter](WebSG.World.md#onenter)
- [onload](WebSG.World.md#onload)
- [onupdate](WebSG.World.md#onupdate)

### Methods

- [createAccessorFrom](WebSG.World.md#createaccessorfrom)
- [createBoxMesh](WebSG.World.md#createboxmesh)
- [createCollider](WebSG.World.md#createcollider)
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

[src/engine/scripting/websg-api.d.ts:37](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L37)

___

### onenter

• **onenter**: ``null`` \| () => `any`

Called when the user enters the world.

**`Method`**

onenter

#### Defined in

[packages/websg-types/types/websg.d.ts:2031](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L2031)

___

### onload

• **onload**: ``null`` \| () => `any`

Called when the world is loaded.

**`Method`**

onload

#### Defined in

[packages/websg-types/types/websg.d.ts:2025](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L2025)

___

### onupdate

• **onupdate**: ``null`` \| (`dt`: `number`, `time`: `number`) => `any`

Called when the world is updated.

**`Method`**

onupdate

**`Param`**

The time since the last update in seconds.

**`Param`**

The total time since the start of the world in seconds.

#### Defined in

[packages/websg-types/types/websg.d.ts:2039](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L2039)

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

[src/engine/scripting/websg-api.d.ts:126](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L126)

▸ **createAccessorFrom**(`buffer`, `props`): [`Accessor`](WebSG.Accessor.md)

Creates an Accessor from the given ArrayBuffer and properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `buffer` | `ArrayBuffer` | The ArrayBuffer to create the Accessor from. |
| `props` | [`AccessorFromProps`](../interfaces/WebSG.AccessorFromProps.md) | The properties for the new Accessor. |

#### Returns

[`Accessor`](WebSG.Accessor.md)

The created Accessor.

#### Defined in

[packages/websg-types/types/websg.d.ts:1845](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1845)

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

[src/engine/scripting/websg-api.d.ts:77](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L77)

▸ **createBoxMesh**(`props`): [`Mesh`](WebSG.Mesh.md)

Creates a Box Mesh with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`BoxMeshProps`](../interfaces/WebSG.BoxMeshProps.md) | The properties for the new Box Mesh. |

#### Returns

[`Mesh`](WebSG.Mesh.md)

The created Box Mesh.

#### Defined in

[packages/websg-types/types/websg.d.ts:1915](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1915)

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

[src/engine/scripting/websg-api.d.ts:85](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L85)

▸ **createCollider**(`props`): [`Collider`](WebSG.Collider.md)

Creates a Collider with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`ColliderProps`](../interfaces/WebSG.ColliderProps.md) | The properties for the new Collider. |

#### Returns

[`Collider`](WebSG.Collider.md)

The created Collider.

#### Defined in

[packages/websg-types/types/websg.d.ts:1859](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1859)

___

### createLight

▸ **createLight**(`props`): [`Light`](WebSG.Light.md)

Creates a Light with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`LightProps`](../interfaces/WebSG.LightProps.md) | The properties for the new Light. |

#### Returns

[`Light`](WebSG.Light.md)

The created Light.

#### Defined in

[packages/websg-types/types/websg.d.ts:1873](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1873)

___

### createMaterial

▸ **createMaterial**(`props`): [`Material`](WebSG.Material.md)

Creates a Material with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`MaterialProps`](../interfaces/WebSG.MaterialProps.md) | The properties for the new Material. |

#### Returns

[`Material`](WebSG.Material.md)

The created Material.

#### Defined in

[packages/websg-types/types/websg.d.ts:1894](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1894)

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

[src/engine/scripting/websg-api.d.ts:134](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L134)

▸ **createMesh**(`props`): [`Mesh`](WebSG.Mesh.md)

Creates a Mesh with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`MeshProps`](../interfaces/WebSG.MeshProps.md) | The properties for the new Mesh. |

#### Returns

[`Mesh`](WebSG.Mesh.md)

The created Mesh.

#### Defined in

[packages/websg-types/types/websg.d.ts:1908](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1908)

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

[src/engine/scripting/websg-api.d.ts:69](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L69)

▸ **createNode**(`props?`): [`Node`](WebSG.Node.md)

Creates a new node with the given properties.

**`Method`**

createNode

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`NodeProps`](../interfaces/WebSG.NodeProps.md) | Optional properties to set for the new node. |

#### Returns

[`Node`](WebSG.Node.md)

- The created node.

#### Defined in

[packages/websg-types/types/websg.d.ts:1931](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1931)

___

### createScene

▸ **createScene**(`props?`): [`Scene`](WebSG.Scene.md)

Creates a new scene with the given properties.

**`Method`**

createScene

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`SceneProps`](../interfaces/WebSG.SceneProps.md) | Optional properties to set for the new scene. |

#### Returns

[`Scene`](WebSG.Scene.md)

- The created scene.

#### Defined in

[packages/websg-types/types/websg.d.ts:1947](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1947)

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

[src/engine/scripting/websg-api.d.ts:117](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L117)

▸ **createUIButton**(`props?`): [`UIButton`](WebSG.UIButton.md)

Creates a new UIButton with the given properties.

**`Method`**

create

**`Method`**

createUIButton

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`UIButtonProps`](../interfaces/WebSG.UIButtonProps.md) | Optional properties to set for the new UIButton. |

#### Returns

[`UIButton`](WebSG.UIButton.md)

- The created UIButton.

#### Defined in

[packages/websg-types/types/websg.d.ts:2004](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L2004)

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

[src/engine/scripting/websg-api.d.ts:93](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L93)

▸ **createUICanvas**(`props?`): [`UICanvas`](WebSG.UICanvas.md)

Creates a new UICanvas with the given properties.

**`Method`**

createUICanvas

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`UICanvasProps`](../interfaces/WebSG.UICanvasProps.md) | Optional properties to set for the new UICanvas. |

#### Returns

[`UICanvas`](WebSG.UICanvas.md)

- The created UICanvas.

#### Defined in

[packages/websg-types/types/websg.d.ts:1971](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1971)

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

[src/engine/scripting/websg-api.d.ts:101](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L101)

▸ **createUIElement**(`props?`): [`UIElement`](WebSG.UIElement.md)

Creates a new UIElement with the given properties.

**`Method`**

createUIElement

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`UIElementProps`](../interfaces/WebSG.UIElementProps.md) | Optional properties to set for the new UIElement. |

#### Returns

[`UIElement`](WebSG.UIElement.md)

- The created UIElement.

#### Defined in

[packages/websg-types/types/websg.d.ts:1987](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1987)

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

[src/engine/scripting/websg-api.d.ts:109](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L109)

▸ **createUIText**(`props?`): [`UIText`](WebSG.UIText.md)

Creates a new UIText with the given properties.

**`Method`**

createUIText

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props?` | [`UITextProps`](../interfaces/WebSG.UITextProps.md) | Optional properties to set for the new UIText. |

#### Returns

[`UIText`](WebSG.UIText.md)

- The created UIText.

#### Defined in

[packages/websg-types/types/websg.d.ts:1995](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1995)

___

### createUnlitMaterial

▸ **createUnlitMaterial**(`props`): [`Material`](WebSG.Material.md)

Creates an unlit Material with the given properties.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`UnlitMaterialProps`](../interfaces/WebSG.UnlitMaterialProps.md) | The properties for the new unlit Material. |

#### Returns

[`Material`](WebSG.Material.md)

The created unlit Material.

#### Defined in

[packages/websg-types/types/websg.d.ts:1887](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1887)

___

### findAccessorByName

▸ **findAccessorByName**(`name`): `undefined` \| [`Accessor`](WebSG.Accessor.md)

Finds an Accessor by its name.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the Accessor to find. |

#### Returns

`undefined` \| [`Accessor`](WebSG.Accessor.md)

The found Accessor or undefined if not found.

#### Defined in

[packages/websg-types/types/websg.d.ts:1852](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1852)

___

### findColliderByName

▸ **findColliderByName**(`name`): `undefined` \| [`Collider`](WebSG.Collider.md)

Finds a Collider by its name.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the Collider to find. |

#### Returns

`undefined` \| [`Collider`](WebSG.Collider.md)

The found Collider or undefined if not found.

#### Defined in

[packages/websg-types/types/websg.d.ts:1866](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1866)

___

### findLightByName

▸ **findLightByName**(`name`): `undefined` \| [`Light`](WebSG.Light.md)

Finds a Light by its name.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the Light to find. |

#### Returns

`undefined` \| [`Light`](WebSG.Light.md)

The found Light or undefined if not found.

#### Defined in

[packages/websg-types/types/websg.d.ts:1880](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1880)

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

[src/engine/scripting/websg-api.d.ts:61](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L61)

▸ **findMaterialByName**(`name`): `undefined` \| [`Material`](WebSG.Material.md)

Finds a Material by its name.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the Material to find. |

#### Returns

`undefined` \| [`Material`](WebSG.Material.md)

The found Material or undefined if not found.

#### Defined in

[packages/websg-types/types/websg.d.ts:1901](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1901)

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

[src/engine/scripting/websg-api.d.ts:53](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L53)

▸ **findMeshByName**(`name`): `undefined` \| [`Mesh`](WebSG.Mesh.md)

Finds a mesh by its name.

**`Method`**

findMeshByName

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the mesh to find. |

#### Returns

`undefined` \| [`Mesh`](WebSG.Mesh.md)

- The mesh found or undefined if not found.

#### Defined in

[packages/websg-types/types/websg.d.ts:1923](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1923)

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

[src/engine/scripting/websg-api.d.ts:45](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L45)

▸ **findNodeByName**(`name`): `undefined` \| [`Node`](WebSG.Node.md)

Finds a node by its name.

**`Method`**

findNodeByName

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the node to find. |

#### Returns

`undefined` \| [`Node`](WebSG.Node.md)

- The node found or undefined if not found.

#### Defined in

[packages/websg-types/types/websg.d.ts:1939](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1939)

___

### findSceneByName

▸ **findSceneByName**(`name`): `undefined` \| [`Scene`](WebSG.Scene.md)

Finds a scene by its name.

**`Method`**

findSceneByName

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the scene to find. |

#### Returns

`undefined` \| [`Scene`](WebSG.Scene.md)

- The scene found or undefined if not found.

#### Defined in

[packages/websg-types/types/websg.d.ts:1955](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1955)

___

### findTextureByName

▸ **findTextureByName**(`name`): `undefined` \| [`Texture`](WebSG.Texture.md)

Finds a texture by its name.

**`Method`**

findTextureByName

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the texture to find. |

#### Returns

`undefined` \| [`Texture`](WebSG.Texture.md)

- The texture found or undefined if not found.

#### Defined in

[packages/websg-types/types/websg.d.ts:1963](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1963)

___

### findUICanvasByName

▸ **findUICanvasByName**(`name`): `undefined` \| [`UICanvas`](WebSG.UICanvas.md)

Finds a UICanvas by its name.

**`Method`**

findUICanvasByName

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the UICanvas to find. |

#### Returns

`undefined` \| [`UICanvas`](WebSG.UICanvas.md)

- The UICanvas found or undefined if not found.

#### Defined in

[packages/websg-types/types/websg.d.ts:1979](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L1979)

___

### findUIElementByName

▸ **findUIElementByName**(`name`): `undefined` \| [`UIElement`](WebSG.UIElement.md)

Finds a UIElement by its name.

**`Method`**

findUIElementByName

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `name` | `string` | The name of the UIElement to find. |

#### Returns

`undefined` \| [`UIElement`](WebSG.UIElement.md)

- The UIElement found or undefined if not found.

#### Defined in

[packages/websg-types/types/websg.d.ts:2012](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L2012)

___

### stopOrbit

▸ **stopOrbit**(): `void`

Stops orbiting

#### Returns

`void`

#### Defined in

[src/engine/scripting/websg-api.d.ts:139](https://github.com/matrix-org/thirdroom/blob/53b6168d/src/engine/scripting/websg-api.d.ts#L139)

▸ **stopOrbit**(): `undefined`

Stops any ongoing orbiting operation.

**`Method`**

stopOrbit

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2019](https://github.com/matrix-org/thirdroom/blob/53b6168d/packages/websg-types/types/websg.d.ts#L2019)
