# Node

**`Class`**

Class representing a node in a scene graph.

**Source:** [websg.d.ts:692](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L692)

## Constructors

### constructor()

> **new Node**(): [`Node`](class.Node.md)

#### Returns

[`Node`](class.Node.md)

## Properties

### matrix

> `readonly` **matrix**: [`Matrix4`](class.Matrix4.md)

The node's local transformation matrix as a Matrix4.

**Source:** [websg.d.ts:711](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L711)

### rotation

> `readonly` **rotation**: [`Quaternion`](class.Quaternion.md)

The node's rotation as a Quaternion.

**Source:** [websg.d.ts:701](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L701)

### scale

> `readonly` **scale**: [`Vector3`](class.Vector3.md)

The node's scale as a Vector3.

**Source:** [websg.d.ts:706](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L706)

### translation

> `readonly` **translation**: [`Vector3`](class.Vector3.md)

The node's translation as a Vector3.

**Source:** [websg.d.ts:696](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L696)

### worldMatrix

> `readonly` **worldMatrix**: [`ReadonlyMatrix4`](class.ReadonlyMatrix4.md)

The node's world transformation matrix as a ReadonlyMatrix4.

**Source:** [websg.d.ts:716](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L716)

## Accessors

### collider

> get **collider()**: `undefined` \| [`Collider`](class.Collider.md)

**Source:** [websg.d.ts:795](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L795) [websg.d.ts:801](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L801)

### interactable

> get **interactable()**: `undefined` \| [`Interactable`](class.Interactable.md)

**Source:** [websg.d.ts:817](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L817)

### isStatic

> get **isStatic()**: `boolean`

**Source:** [websg.d.ts:749](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L749) [websg.d.ts:757](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L757)

### light

> get **light()**: `undefined` \| [`Light`](class.Light.md)

**Source:** [websg.d.ts:784](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L784) [websg.d.ts:790](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L790)

### mesh

> get **mesh()**: `undefined` \| [`Mesh`](class.Mesh.md)

**Source:** [websg.d.ts:773](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L773) [websg.d.ts:779](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L779)

### parent

> get **parent()**: `undefined` \| [`Node`](class.Node.md)

**Source:** [websg.d.ts:744](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L744)

### physicsBody

> get **physicsBody()**: `undefined` \| [`PhysicsBody`](class.PhysicsBody.md)

**Source:** [websg.d.ts:833](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L833)

### uiCanvas

> get **uiCanvas()**: `undefined` \| [`UICanvas`](class.UICanvas.md)

**Source:** [websg.d.ts:806](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L806) [websg.d.ts:812](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L812)

### visible

> get **visible()**: `boolean`

**Source:** [websg.d.ts:762](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L762) [websg.d.ts:768](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L768)

## Methods

### addChild()

> **addChild**(node: [`Node`](class.Node.md)): [`Node`](class.Node.md)

Adds a child node to this node.

**Source:** [websg.d.ts:722](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L722)

#### Parameters

| Parameter | Type                    | Description                 |
| :-------- | :---------------------- | :-------------------------- |
| node      | [`Node`](class.Node.md) | The node to add as a child. |

#### Returns

[`Node`](class.Node.md)

### addComponent()

> **addComponent**(component: [`ComponentStore`](class.ComponentStore.md)): `undefined`

Adds a component to this node.

**Source:** [websg.d.ts:855](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L855)

#### Parameters

| Parameter | Type                                        | Description                |
| :-------- | :------------------------------------------ | :------------------------- |
| component | [`ComponentStore`](class.ComponentStore.md) | the component type to add. |

#### Returns

`undefined`

### addInteractable()

> **addInteractable**(props?: [`InteractableProps`](../type-aliases/type-alias.InteractableProps.md)): [`Interactable`](class.Interactable.md)

Adds an interactable behavior to this node.

**Source:** [websg.d.ts:823](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L823)

#### Parameters

| Parameter | Type                                                                   | Description                       |
| :-------- | :--------------------------------------------------------------------- | :-------------------------------- |
| props?    | [`InteractableProps`](../type-aliases/type-alias.InteractableProps.md) | Optional interactable properties. |

#### Returns

[`Interactable`](class.Interactable.md)

### addPhysicsBody()

> **addPhysicsBody**(props?: [`PhysicsBodyProps`](../interfaces/interface.PhysicsBodyProps.md)): [`PhysicsBody`](class.PhysicsBody.md)

Adds a physics body behavior to this node.

**Source:** [websg.d.ts:839](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L839)

#### Parameters

| Parameter | Type                                                              | Description                       |
| :-------- | :---------------------------------------------------------------- | :-------------------------------- |
| props?    | [`PhysicsBodyProps`](../interfaces/interface.PhysicsBodyProps.md) | Optional physics body properties. |

#### Returns

[`PhysicsBody`](class.PhysicsBody.md)

### children()

> **children**(): [`NodeIterator`](class.NodeIterator.md)

Returns an iterator for the children of this node.

**Source:** [websg.d.ts:739](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L739)

#### Returns

[`NodeIterator`](class.NodeIterator.md)

### getChild()

> **getChild**(index: `number`): `undefined` \| [`Node`](class.Node.md)

Gets the child node at the specified index or undefined if the index is out of range.

**Source:** [websg.d.ts:734](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L734)

#### Parameters

| Parameter | Type     | Description                  |
| :-------- | :------- | :--------------------------- |
| index     | `number` | The index of the child node. |

#### Returns

`undefined` \| [`Node`](class.Node.md)

### getComponent()

> **getComponent**(component: [`ComponentStore`](class.ComponentStore.md)): `undefined` \| [`Component`](class.Component.md)

Gets an instance of a component of the specified type on this node.
If the component does not exist on this node, it will return undefined.

**Source:** [websg.d.ts:871](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L871)

#### Parameters

| Parameter | Type                                        | Description                |
| :-------- | :------------------------------------------ | :------------------------- |
| component | [`ComponentStore`](class.ComponentStore.md) | the component type to get. |

#### Returns

`undefined` \| [`Component`](class.Component.md)

### hasComponent()

> **hasComponent**(component: [`ComponentStore`](class.ComponentStore.md)): `boolean`

Checks if this node has a component.

**Source:** [websg.d.ts:865](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L865)

#### Parameters

| Parameter | Type                                        | Description                      |
| :-------- | :------------------------------------------ | :------------------------------- |
| component | [`ComponentStore`](class.ComponentStore.md) | the component type to check for. |

#### Returns

`boolean`

### removeChild()

> **removeChild**(node: [`Node`](class.Node.md)): [`Node`](class.Node.md)

Removes a child node from this node.

**Source:** [websg.d.ts:728](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L728)

#### Parameters

| Parameter | Type                    | Description         |
| :-------- | :---------------------- | :------------------ |
| node      | [`Node`](class.Node.md) | The node to remove. |

#### Returns

[`Node`](class.Node.md)

### removeComponent()

> **removeComponent**(component: [`ComponentStore`](class.ComponentStore.md)): `undefined`

Removes a component from this node.

**Source:** [websg.d.ts:860](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L860)

#### Parameters

| Parameter | Type                                        | Description                   |
| :-------- | :------------------------------------------ | :---------------------------- |
| component | [`ComponentStore`](class.ComponentStore.md) | the component type to remove. |

#### Returns

`undefined`

### removeInteractable()

> **removeInteractable**(): `undefined`

Removes the interactable property from this node.

**Source:** [websg.d.ts:828](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L828)

#### Returns

`undefined`

### removePhysicsBody()

> **removePhysicsBody**(): `undefined`

Removes the physics body behavior from this node.

**Source:** [websg.d.ts:844](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L844)

#### Returns

`undefined`

### startOrbit()

> **startOrbit**(options?: [`OrbitOptions`](../interfaces/interface.OrbitOptions.md)): `undefined`

Enables orbit camera control mode for this node.

**Source:** [websg.d.ts:850](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L850)

#### Parameters

| Parameter | Type                                                      | Description             |
| :-------- | :-------------------------------------------------------- | :---------------------- |
| options?  | [`OrbitOptions`](../interfaces/interface.OrbitOptions.md) | Optional orbit options. |

#### Returns

`undefined`
