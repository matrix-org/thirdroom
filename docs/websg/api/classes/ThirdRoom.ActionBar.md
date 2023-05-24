[WebSG API](../README.md) / [ThirdRoom](../modules/ThirdRoom.md) / ActionBar

# Class: ActionBar

[ThirdRoom](../modules/ThirdRoom.md).ActionBar

Represents the action bar at the bottom of the screen.
Items can be set via the [setItems](ThirdRoom.ActionBar.md#setitems) method.
You can listen for triggered actions by creating a new listener via the
[createListener](ThirdRoom.ActionBar.md#createlistener) method.

## Table of contents

### Constructors

- [constructor](ThirdRoom.ActionBar.md#constructor)

### Methods

- [createListener](ThirdRoom.ActionBar.md#createlistener)
- [setItems](ThirdRoom.ActionBar.md#setitems)

## Constructors

### constructor

• **new ActionBar**()

## Methods

### createListener

▸ **createListener**(): [`ActionBarListener`](ThirdRoom.ActionBarListener.md)

Creates a new [ActionBarListener](ThirdRoom.ActionBarListener.md) for the action bar.

#### Returns

[`ActionBarListener`](ThirdRoom.ActionBarListener.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2661](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L2661)

___

### setItems

▸ **setItems**(`items`): `undefined`

Replaces the items in the action bar with the given items.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `items` | [`ActionBarItem`](../interfaces/ThirdRoom.ActionBarItem.md)[] | The [ActionBarItem](../interfaces/ThirdRoom.ActionBarItem.md)s to set. |

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2657](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L2657)
