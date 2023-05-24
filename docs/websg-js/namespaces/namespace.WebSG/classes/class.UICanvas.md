# UICanvas

**`Class`**

A UICanvas is used to render UI elements to a flat plane in the world.

**Source:** [websg.d.ts:1216](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1216)

## Constructors

### constructor()

> **new UICanvas**(): [`UICanvas`](class.UICanvas.md)

#### Returns

[`UICanvas`](class.UICanvas.md)

## Properties

### size

> `readonly` **size**: [`Vector2`](class.Vector2.md)

Gets the canvas size as a Vector2 in meters.

**Source:** [websg.d.ts:1259](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1259)

## Accessors

### height

> get **height()**: `number`

**Source:** [websg.d.ts:1242](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1242) [websg.d.ts:1248](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1248)

### root

> get **root()**: `undefined` \| [`UIElement`](class.UIElement.md)

**Source:** [websg.d.ts:1220](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1220) [websg.d.ts:1226](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1226)

### width

> get **width()**: `number`

**Source:** [websg.d.ts:1231](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1231) [websg.d.ts:1237](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1237)

## Methods

### redraw()

> **redraw**(): `undefined`

Redraws the canvas.
This should be called any time the UI elements are changed.

**Source:** [websg.d.ts:1254](https://github.com/thirdroom/thirdroom/blob/4c397b03/packages/websg-types/types/websg.d.ts#L1254)

#### Returns

`undefined`
