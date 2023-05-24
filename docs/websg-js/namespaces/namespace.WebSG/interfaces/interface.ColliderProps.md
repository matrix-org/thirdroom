# ColliderProps

**`Interface`**

Collider properties interface.

**Source:** [websg.d.ts:118](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L118)

## Properties

### height

> **height**?: `number`

The height of the Collider (required for capsule and cylinder types).

**Source:** [websg.d.ts:138](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L138)

### isTrigger

> **isTrigger**?: `boolean`

Determines if the Collider acts as a trigger.

**Source:** [websg.d.ts:126](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L126)

### mesh

> **mesh**?: [`Mesh`](../classes/class.Mesh.md)

The mesh representing the shape of the Collider (required for hull and trimesh types).

**Source:** [websg.d.ts:142](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L142)

### radius

> **radius**?: `number`

The radius of the Collider (required for sphere, capsule, and cylinder types).

**Source:** [websg.d.ts:134](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L134)

### size

> **size**?: `ArrayLike`\<`number`\>

The size of the Collider (required for box type).

**Source:** [websg.d.ts:130](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L130)

### type

> **type**: [`ColliderType`](../variables/variable.ColliderType-1.md)

The type of the Collider.

**Source:** [websg.d.ts:122](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L122)
