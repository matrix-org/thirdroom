[WebSG API](../README.md) / [ThirdRoom](../modules/ThirdRoom.md) / ActionBarItem

# Interface: ActionBarItem

[ThirdRoom](../modules/ThirdRoom.md).ActionBarItem

Represents an item in the action bar.

## Table of contents

### Properties

- [id](ThirdRoom.ActionBarItem.md#id)
- [label](ThirdRoom.ActionBarItem.md#label)
- [thumbnail](ThirdRoom.ActionBarItem.md#thumbnail)

## Properties

### id

• **id**: `string`

Used to identify the action when it is triggered.

#### Defined in

[packages/websg-types/types/websg.d.ts:2632](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2632)

___

### label

• **label**: `string`

Used to display what the action does when hovering over an action.

#### Defined in

[packages/websg-types/types/websg.d.ts:2636](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2636)

___

### thumbnail

• **thumbnail**: [`Image`](../classes/WebSG.Image.md)

Used to display an icon in the action bar.
Note that the thumbnail must be a square uncompressed image (e.g. .png or .jpg)
Basis Universal compressed images (e.g. .ktx2) are not supported.

#### Defined in

[packages/websg-types/types/websg.d.ts:2642](https://github.com/thirdroom/thirdroom/blob/c8b57e0e/packages/websg-types/types/websg.d.ts#L2642)
