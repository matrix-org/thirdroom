[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / UIElementIterator

# Class: UIElementIterator

[WebSG](../modules/WebSG.md).UIElementIterator

An iterator for UIElement objects.

## Table of contents

### Constructors

- [constructor](WebSG.UIElementIterator.md#constructor)

### Methods

- [[iterator]](WebSG.UIElementIterator.md#[iterator])
- [next](WebSG.UIElementIterator.md#next)

## Constructors

### constructor

• **new UIElementIterator**()

## Methods

### [iterator]

▸ **[iterator]**(): [`UIElementIterator`](WebSG.UIElementIterator.md)

#### Returns

[`UIElementIterator`](WebSG.UIElementIterator.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:1445](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L1445)

___

### next

▸ **next**(): `Object`

Gets the next UI element in the iterator.

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `done` | `boolean` |
| `value` | [`UIElement`](WebSG.UIElement.md) |

#### Defined in

[packages/websg-types/types/websg.d.ts:1444](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L1444)
