# ActionBarListener

**`Class`**

An ActionBarListener is used to listen for actions triggered in the action bar.
The [.actions()](class.ActionBarListener.md#actions) method should be called
each frame to drain the action bar's action queue. If you are done with the action queue,
call [.dispose()](class.ActionBarListener.md#dispose) to dispose the listener.

**Source:** [websg.d.ts:2593](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2593)

## Constructors

### constructor()

> **new ActionBarListener**(): [`ActionBarListener`](class.ActionBarListener.md)

#### Returns

[`ActionBarListener`](class.ActionBarListener.md)

## Methods

### actions()

> **actions**(): [`ActionBarIterator`](class.ActionBarIterator.md)

Returns an iterator over the actions triggered in the action bar since the last call to this method.

**Source:** [websg.d.ts:2597](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2597)

#### Returns

[`ActionBarIterator`](class.ActionBarIterator.md)

### dispose()

> **dispose**(): `undefined`

Disposes the action bar listener.

**Source:** [websg.d.ts:2602](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L2602)

#### Returns

`undefined`
