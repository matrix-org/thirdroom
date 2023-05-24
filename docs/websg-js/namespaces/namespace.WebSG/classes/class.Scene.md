# Scene

**`Class`**

Class representing the root of a scene graph.

**Source:** [websg.d.ts:1107](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1107)

## Constructors

### constructor()

> **new Scene**(): [`Scene`](class.Scene.md)

#### Returns

[`Scene`](class.Scene.md)

## Methods

### addNode()

> **addNode**(node: [`Node`](class.Node.md)): [`Scene`](class.Scene.md)

Adds a node to the scene.

**Source:** [websg.d.ts:1113](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1113)

#### Parameters

| Parameter | Type                    | Description                        |
| :-------- | :---------------------- | :--------------------------------- |
| node      | [`Node`](class.Node.md) | The node to be added to the scene. |

#### Returns

[`Scene`](class.Scene.md)

The instance of the Scene class (for method chaining).

### getNode()

> **getNode**(index: `number`): `undefined` \| [`Node`](class.Node.md)

Gets a node from the scene by its index.

**Source:** [websg.d.ts:1127](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1127)

#### Parameters

| Parameter | Type     | Description                            |
| :-------- | :------- | :------------------------------------- |
| index     | `number` | The index of the node to be retrieved. |

#### Returns

`undefined` \| [`Node`](class.Node.md)

The node at the given index, or undefined if no node exists at the index.

### nodes()

> **nodes**(): [`NodeIterator`](class.NodeIterator.md)

Returns an iterator for the nodes in the scene.

**Source:** [websg.d.ts:1133](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1133)

#### Returns

[`NodeIterator`](class.NodeIterator.md)

An iterator for the nodes in the scene.

### removeNode()

> **removeNode**(node: [`Node`](class.Node.md)): [`Scene`](class.Scene.md)

Removes a node from the scene.

**Source:** [websg.d.ts:1120](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1120)

#### Parameters

| Parameter | Type                    | Description                            |
| :-------- | :---------------------- | :------------------------------------- |
| node      | [`Node`](class.Node.md) | The node to be removed from the scene. |

#### Returns

[`Scene`](class.Scene.md)

The instance of the Scene class (for method chaining).
