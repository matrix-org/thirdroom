# AccessorFromProps

**`Interface`**

Interface describing the properties of an Accessor created from an ArrayBuffer.

**Source:** [websg.d.ts:41](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L41)

## Properties

### componentType

> **componentType**: [`AccessorComponentType`](../variables/variable.AccessorComponentType-1.md)

The data type of individual components in the data.

**Source:** [websg.d.ts:49](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L49)

### count

> **count**: `number`

The number of elements in the accessor.

**Source:** [websg.d.ts:53](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L53)

### dynamic

> **dynamic**?: `boolean`

Whether the accessor's data is dynamic and can change over time (default is `false`).

**Source:** [websg.d.ts:61](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L61)

### max

> **max**?: `number`[]

The maximum values of the accessor's components (optional).

**Source:** [websg.d.ts:69](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L69)

### min

> **min**?: `number`[]

The minimum values of the accessor's components (optional).

**Source:** [websg.d.ts:65](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L65)

### normalized

> **normalized**?: `boolean`

Whether the data should be normalized when accessed (default is `false`).

**Source:** [websg.d.ts:57](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L57)

### type

> **type**: [`AccessorType`](../variables/variable.AccessorType-1.md)

The shape of the data the accessor represents.

**Source:** [websg.d.ts:45](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L45)
