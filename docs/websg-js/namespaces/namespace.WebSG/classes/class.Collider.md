# Collider

**`Class`**

The Collider class represents a shape that can be used for
collision detection in a physics simulation.

**Source:** [websg.d.ts:149](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L149)

## Constructors

### constructor()

> **new Collider**(props: [`ColliderProps`](../interfaces/interface.ColliderProps.md)): [`Collider`](class.Collider.md)

Creates a new Collider instance with the specified properties.

#### Example

```ts
// Create a new box Collider
const collider = world.createCollider({
  type: ColliderType.Box,
  size: [1, 1, 1],
});
```

**Source:** [websg.d.ts:162](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L162)

#### Parameters

| Parameter | Type                                                        | Description                     |
| :-------- | :---------------------------------------------------------- | :------------------------------ |
| props     | [`ColliderProps`](../interfaces/interface.ColliderProps.md) | The properties of the Collider. |

#### Returns

[`Collider`](class.Collider.md)
