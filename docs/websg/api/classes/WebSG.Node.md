[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / Node

# Class: Node

[WebSG](../modules/WebSG.md).Node

Class representing a node in a scene graph.

## Table of contents

### Constructors

- [constructor](WebSG.Node.md#constructor)

### Properties

- [addChild](WebSG.Node.md#addchild)
- [addInteractable](WebSG.Node.md#addinteractable)
- [addPhysicsBody](WebSG.Node.md#addphysicsbody)
- [children](WebSG.Node.md#children)
- [collider](WebSG.Node.md#collider)
- [getChild](WebSG.Node.md#getchild)
- [interactable](WebSG.Node.md#interactable)
- [isStatic](WebSG.Node.md#isstatic)
- [light](WebSG.Node.md#light)
- [matrix](WebSG.Node.md#matrix)
- [mesh](WebSG.Node.md#mesh)
- [parent](WebSG.Node.md#parent)
- [physicsBody](WebSG.Node.md#physicsbody)
- [removeChild](WebSG.Node.md#removechild)
- [removeInteractable](WebSG.Node.md#removeinteractable)
- [removePhysicsBody](WebSG.Node.md#removephysicsbody)
- [rotation](WebSG.Node.md#rotation)
- [scale](WebSG.Node.md#scale)
- [translation](WebSG.Node.md#translation)
- [uiCanvas](WebSG.Node.md#uicanvas)
- [visible](WebSG.Node.md#visible)
- [worldMatrix](WebSG.Node.md#worldmatrix)

### Methods

- [addComponent](WebSG.Node.md#addcomponent)
- [getComponent](WebSG.Node.md#getcomponent)
- [hasComponent](WebSG.Node.md#hascomponent)
- [removeComponent](WebSG.Node.md#removecomponent)
- [startOrbit](WebSG.Node.md#startorbit)

## Constructors

### constructor

• **new Node**()

## Properties

### addChild

• **addChild**: (`child`: [`Node`](WebSG.Node.md)) => `void`

#### Type declaration

▸ (`child`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `child` | [`Node`](WebSG.Node.md) |

##### Returns

`void`

#### Defined in

[src/engine/scripting/websg-api.d.ts:189](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L189)

___

### addInteractable

• **addInteractable**: () => `void`

#### Type declaration

▸ (): `void`

##### Returns

`void`

#### Defined in

[src/engine/scripting/websg-api.d.ts:197](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L197)

___

### addPhysicsBody

• **addPhysicsBody**: (`options`: `PhysicsBodyOptions`) => `void`

#### Type declaration

▸ (`options`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `PhysicsBodyOptions` |

##### Returns

`void`

#### Defined in

[src/engine/scripting/websg-api.d.ts:202](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L202)

___

### children

• **children**: () => [`Node`](WebSG.Node.md)[]

#### Type declaration

▸ (): [`Node`](WebSG.Node.md)[]

##### Returns

[`Node`](WebSG.Node.md)[]

#### Defined in

[src/engine/scripting/websg-api.d.ts:192](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L192)

___

### collider

• `Optional` **collider**: [`Collider`](WebSG.Collider.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:220](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L220)

___

### getChild

• **getChild**: (`index`: `number`) => [`Node`](WebSG.Node.md)

#### Type declaration

▸ (`index`): [`Node`](WebSG.Node.md)

##### Parameters

| Name | Type |
| :------ | :------ |
| `index` | `number` |

##### Returns

[`Node`](WebSG.Node.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:191](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L191)

___

### interactable

• `Optional` **interactable**: [`Interactable`](WebSG.Interactable.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:196](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L196)

___

### isStatic

• **isStatic**: `boolean`

#### Defined in

[src/engine/scripting/websg-api.d.ts:215](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L215)

___

### light

• `Optional` **light**: [`Light`](WebSG.Light.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:219](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L219)

___

### matrix

• **matrix**: `Object`

The node's local transformation matrix as a Matrix4.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `elements` | [`Matrix4`](WebSG.Matrix4.md) |

#### Defined in

[src/engine/scripting/websg-api.d.ts:209](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L209)

[packages/websg-types/types/websg.d.ts:714](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L714)

___

### mesh

• `Optional` **mesh**: [`Mesh`](WebSG.Mesh.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:218](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L218)

___

### parent

• **parent**: [`Scene`](WebSG.Scene.md) \| [`Node`](WebSG.Node.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:193](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L193)

___

### physicsBody

• `Optional` **physicsBody**: [`PhysicsBody`](WebSG.PhysicsBody.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:201](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L201)

___

### removeChild

• **removeChild**: (`child`: [`Node`](WebSG.Node.md)) => `void`

#### Type declaration

▸ (`child`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `child` | [`Node`](WebSG.Node.md) |

##### Returns

`void`

#### Defined in

[src/engine/scripting/websg-api.d.ts:190](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L190)

___

### removeInteractable

• **removeInteractable**: () => `void`

#### Type declaration

▸ (): `void`

##### Returns

`void`

#### Defined in

[src/engine/scripting/websg-api.d.ts:198](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L198)

___

### removePhysicsBody

• **removePhysicsBody**: () => `void`

#### Type declaration

▸ (): `void`

##### Returns

`void`

#### Defined in

[src/engine/scripting/websg-api.d.ts:203](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L203)

___

### rotation

• **rotation**: [`Vector4`](WebSG.Vector4.md)

The node's rotation as a Quaternion.

#### Defined in

[src/engine/scripting/websg-api.d.ts:207](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L207)

[packages/websg-types/types/websg.d.ts:704](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L704)

___

### scale

• **scale**: [`Vector3`](WebSG.Vector3.md)

The node's scale as a Vector3.

#### Defined in

[src/engine/scripting/websg-api.d.ts:208](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L208)

[packages/websg-types/types/websg.d.ts:709](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L709)

___

### translation

• **translation**: [`Vector3`](WebSG.Vector3.md)

The node's translation as a Vector3.

#### Defined in

[src/engine/scripting/websg-api.d.ts:206](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L206)

[packages/websg-types/types/websg.d.ts:699](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L699)

___

### uiCanvas

• `Optional` **uiCanvas**: [`UICanvas`](WebSG.UICanvas.md)

#### Defined in

[src/engine/scripting/websg-api.d.ts:221](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L221)

___

### visible

• **visible**: `boolean`

#### Defined in

[src/engine/scripting/websg-api.d.ts:216](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L216)

___

### worldMatrix

• **worldMatrix**: `Object`

The node's world transformation matrix as a ReadonlyMatrix4.

#### Type declaration

| Name | Type |
| :------ | :------ |
| `elements` | [`Matrix4`](WebSG.Matrix4.md) |

#### Defined in

[src/engine/scripting/websg-api.d.ts:212](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L212)

[packages/websg-types/types/websg.d.ts:719](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L719)

## Methods

### addComponent

▸ **addComponent**(`component`): `undefined`

Adds a component to this node.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `component` | [`ComponentStore`](WebSG.ComponentStore.md) | the component type to add. |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:858](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L858)

___

### getComponent

▸ **getComponent**(`component`): `undefined` \| [`Component`](WebSG.Component.md)

Gets an instance of a component of the specified type on this node.
If the component does not exist on this node, it will return undefined.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `component` | [`ComponentStore`](WebSG.ComponentStore.md) | the component type to get. |

#### Returns

`undefined` \| [`Component`](WebSG.Component.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:874](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L874)

___

### hasComponent

▸ **hasComponent**(`component`): `boolean`

Checks if this node has a component.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `component` | [`ComponentStore`](WebSG.ComponentStore.md) | the component type to check for. |

#### Returns

`boolean`

#### Defined in

[packages/websg-types/types/websg.d.ts:868](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L868)

___

### removeComponent

▸ **removeComponent**(`component`): `undefined`

Removes a component from this node.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `component` | [`ComponentStore`](WebSG.ComponentStore.md) | the component type to remove. |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:863](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L863)

___

### startOrbit

▸ **startOrbit**(`options?`): `undefined`

Enables orbit camera control mode for this node.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options?` | [`OrbitOptions`](../interfaces/WebSG.OrbitOptions.md) | Optional orbit options. |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:853](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L853)
