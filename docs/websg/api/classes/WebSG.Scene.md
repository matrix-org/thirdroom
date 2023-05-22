[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / Scene

# Class: Scene

[WebSG](../modules/WebSG.md).Scene

Class representing a scene in a scene graph.

## Table of contents

### Constructors

- [constructor](WebSG.Scene.md#constructor)

### Methods

- [addNode](WebSG.Scene.md#addnode)
- [getNode](WebSG.Scene.md#getnode)
- [nodes](WebSG.Scene.md#nodes)
- [removeNode](WebSG.Scene.md#removenode)

## Constructors

### constructor

• **new Scene**()

## Methods

### addNode

▸ **addNode**(`node`): [`Scene`](WebSG.Scene.md)

Adds a Node to the Scene.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `node` | [`Node`](WebSG.Node.md) | The Node to be added. |

#### Returns

[`Scene`](WebSG.Scene.md)

This Scene instance, for chaining.

#### Defined in

[src/engine/scripting/websg-api.d.ts:162](https://github.com/thirdroom/thirdroom/blob/fe402010/src/engine/scripting/websg-api.d.ts#L162)

▸ **addNode**(`node`): [`Scene`](WebSG.Scene.md)

Adds a node to the scene.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `node` | [`Node`](WebSG.Node.md) | The node to be added to the scene. |

#### Returns

[`Scene`](WebSG.Scene.md)

The instance of the Scene class (for method chaining).

#### Defined in

[packages/websg-types/types/websg.d.ts:1043](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L1043)

___

### getNode

▸ **getNode**(`index`): `undefined` \| [`Node`](WebSG.Node.md)

Gets a node from the scene by its index.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `index` | `number` | The index of the node to be retrieved. |

#### Returns

`undefined` \| [`Node`](WebSG.Node.md)

The node at the given index, or undefined if no node exists at the index.

#### Defined in

[packages/websg-types/types/websg.d.ts:1057](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L1057)

___

### nodes

▸ **nodes**(): [`NodeIterator`](WebSG.NodeIterator.md)

Returns an iterator for the nodes in the scene.

#### Returns

[`NodeIterator`](WebSG.NodeIterator.md)

An iterator for the nodes in the scene.

#### Defined in

[packages/websg-types/types/websg.d.ts:1063](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L1063)

___

### removeNode

▸ **removeNode**(`node`): [`Scene`](WebSG.Scene.md)

Removes a Node from the Scene.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `node` | [`Node`](WebSG.Node.md) | The Node to be removed. |

#### Returns

[`Scene`](WebSG.Scene.md)

This Scene instance, for chaining.

#### Defined in

[src/engine/scripting/websg-api.d.ts:170](https://github.com/thirdroom/thirdroom/blob/fe402010/src/engine/scripting/websg-api.d.ts#L170)

▸ **removeNode**(`node`): [`Scene`](WebSG.Scene.md)

Removes a node from the scene.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `node` | [`Node`](WebSG.Node.md) | The node to be removed from the scene. |

#### Returns

[`Scene`](WebSG.Scene.md)

The instance of the Scene class (for method chaining).

#### Defined in

[packages/websg-types/types/websg.d.ts:1050](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L1050)
