[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / ColliderProps

# Interface: ColliderProps

[WebSG](../modules/WebSG.md).ColliderProps

Physics

## Table of contents

### Properties

- [height](WebSG.ColliderProps.md#height)
- [isTrigger](WebSG.ColliderProps.md#istrigger)
- [mesh](WebSG.ColliderProps.md#mesh)
- [radius](WebSG.ColliderProps.md#radius)
- [size](WebSG.ColliderProps.md#size)
- [type](WebSG.ColliderProps.md#type)

## Properties

### height

• `Optional` **height**: `number`

The height of the Collider (required for capsule and cylinder types).

#### Defined in

[packages/websg-types/types/websg.d.ts:141](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L141)

___

### isTrigger

• `Optional` **isTrigger**: `boolean`

Determines if the Collider acts as a trigger.

#### Defined in

[packages/websg-types/types/websg.d.ts:129](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L129)

___

### mesh

• `Optional` **mesh**: [`Mesh`](../classes/WebSG.Mesh.md)

The mesh representing the shape of the Collider (required for hull and trimesh types).

#### Defined in

[packages/websg-types/types/websg.d.ts:145](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L145)

___

### radius

• `Optional` **radius**: `number`

The radius of the Collider (required for sphere, capsule, and cylinder types).

#### Defined in

[packages/websg-types/types/websg.d.ts:137](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L137)

___

### size

• `Optional` **size**: `ArrayLike`<`number`\>

The size of the Collider (required for box type).

#### Defined in

[packages/websg-types/types/websg.d.ts:133](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L133)

___

### type

• **type**: `ColliderType`

The type of the Collider.

#### Defined in

[packages/websg-types/types/websg.d.ts:125](https://github.com/thirdroom/thirdroom/blob/972fa72b/packages/websg-types/types/websg.d.ts#L125)
