[WebSG API](../README.md) / [ThirdRoom](../modules/ThirdRoom.md) / ActionBarListener

# Class: ActionBarListener

[ThirdRoom](../modules/ThirdRoom.md).ActionBarListener

An ActionBarListener is used to listen for actions triggered in the action bar.
The [.actions()](ThirdRoom.ActionBarListener.md#actions) method should be called
each frame to drain the action bar's action queue. If you are done with the action queue,
call [.dispose()](ThirdRoom.ActionBarListener.md#dispose) to dispose the listener.

## Table of contents

### Constructors

- [constructor](ThirdRoom.ActionBarListener.md#constructor)

### Methods

- [actions](ThirdRoom.ActionBarListener.md#actions)
- [dispose](ThirdRoom.ActionBarListener.md#dispose)

## Constructors

### constructor

• **new ActionBarListener**()

## Methods

### actions

▸ **actions**(): [`ActionBarIterator`](ThirdRoom.ActionBarIterator.md)

Returns an iterator over the actions triggered in the action bar since the last call to this method.

#### Returns

[`ActionBarIterator`](ThirdRoom.ActionBarIterator.md)

#### Defined in

[packages/websg-types/types/websg.d.ts:2610](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L2610)

___

### dispose

▸ **dispose**(): `undefined`

Disposes the action bar listener.

#### Returns

`undefined`

#### Defined in

[packages/websg-types/types/websg.d.ts:2615](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L2615)
