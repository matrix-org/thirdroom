# ActionBar

**`Class`**

Represents the action bar at the bottom of the screen.
Items can be set via the [setItems](class.ActionBar.md#setitems) method.
You can listen for triggered actions by creating a new listener via the
[createListener](class.ActionBar.md#createlistener) method.

**Source:** [websg.d.ts:2639](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2639)

## Constructors

### constructor()

> **new ActionBar**(): [`ActionBar`](class.ActionBar.md)

#### Returns

[`ActionBar`](class.ActionBar.md)

## Methods

### createListener()

> **createListener**(): [`ActionBarListener`](class.ActionBarListener.md)

Creates a new [ActionBarListener](class.ActionBarListener.md) for the action bar.

**Source:** [websg.d.ts:2648](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2648)

#### Returns

[`ActionBarListener`](class.ActionBarListener.md)

### setItems()

> **setItems**(items: [`ActionBarItem`](../interfaces/interface.ActionBarItem.md)[]): `undefined`

Replaces the items in the action bar with the given items.

**Source:** [websg.d.ts:2644](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2644)

#### Parameters

| Parameter | Type                                                          | Description                                                            |
| :-------- | :------------------------------------------------------------ | :--------------------------------------------------------------------- |
| items     | [`ActionBarItem`](../interfaces/interface.ActionBarItem.md)[] | The [ActionBarItem](../interfaces/interface.ActionBarItem.md)s to set. |

#### Returns

`undefined`
