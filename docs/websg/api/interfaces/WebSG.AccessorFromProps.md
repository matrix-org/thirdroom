[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / AccessorFromProps

# Interface: AccessorFromProps

[WebSG](../modules/WebSG.md).AccessorFromProps

## Table of contents

### Properties

- [componentType](WebSG.AccessorFromProps.md#componenttype)
- [count](WebSG.AccessorFromProps.md#count)
- [dynamic](WebSG.AccessorFromProps.md#dynamic)
- [max](WebSG.AccessorFromProps.md#max)
- [min](WebSG.AccessorFromProps.md#min)
- [normalized](WebSG.AccessorFromProps.md#normalized)
- [type](WebSG.AccessorFromProps.md#type)

## Properties

### componentType

• **componentType**: [`AccessorComponentType`](../enums/WebSG.AccessorComponentType.md)

The data type of individual components in the data.

#### Defined in

[packages/websg-types/types/websg.d.ts:54](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L54)

___

### count

• **count**: `number`

The number of elements in the accessor.

#### Defined in

[packages/websg-types/types/websg.d.ts:55](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L55)

___

### dynamic

• `Optional` **dynamic**: `boolean`

Whether the accessor's data is dynamic and can change over time (default is `false`).

#### Defined in

[packages/websg-types/types/websg.d.ts:57](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L57)

___

### max

• `Optional` **max**: `number`[]

The maximum values of the accessor's components (optional).

#### Defined in

[packages/websg-types/types/websg.d.ts:59](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L59)

___

### min

• `Optional` **min**: `number`[]

The minimum values of the accessor's components (optional).

#### Defined in

[packages/websg-types/types/websg.d.ts:58](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L58)

___

### normalized

• `Optional` **normalized**: `boolean`

Whether the data should be normalized when accessed (default is `false`).

#### Defined in

[packages/websg-types/types/websg.d.ts:56](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L56)

___

### type

• **type**: [`AccessorType`](../enums/WebSG.AccessorType.md)

The shape of the data the accessor represents.

#### Defined in

[packages/websg-types/types/websg.d.ts:53](https://github.com/thirdroom/thirdroom/blob/fe402010/packages/websg-types/types/websg.d.ts#L53)
