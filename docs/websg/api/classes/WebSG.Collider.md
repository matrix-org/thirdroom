[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / Collider

# Class: Collider

[WebSG](../modules/WebSG.md).Collider

The Collider class represents a shape that can be used for
collision detection in a physics simulation.

## Table of contents

### Constructors

- [constructor](WebSG.Collider.md#constructor)

## Constructors

### constructor

• **new Collider**(`props`)

Creates a new Collider instance with the specified properties.

**`Example`**

```ts
// Create a new box Collider
const collider = world.createCollider({
  type: ColliderType.Box,
  size: [1, 1, 1],
});
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `props` | [`ColliderProps`](../interfaces/WebSG.ColliderProps.md) | The properties of the Collider. |

#### Defined in

[packages/websg-types/types/websg.d.ts:165](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L165)
