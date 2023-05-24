[WebSG API](../README.md) / [WebSG](../modules/WebSG.md) / UICanvas

# Class: UICanvas

[WebSG](../modules/WebSG.md).UICanvas

A UICanvas is used to render UI elements to a flat plane in the world.

## Hierarchy

- [`UICanvasBase`](../interfaces/WebSG.UICanvasBase.md)

- [`UICanvasProps`](../interfaces/WebSG.UICanvasProps.md)

  ↳ **`UICanvas`**

## Table of contents

### Constructors

- [constructor](WebSG.UICanvas.md#constructor)

### Properties

- [size](WebSG.UICanvas.md#size)

### Accessors

- [height](WebSG.UICanvas.md#height)
- [root](WebSG.UICanvas.md#root)
- [width](WebSG.UICanvas.md#width)

### Methods

- [redraw](WebSG.UICanvas.md#redraw)

## Constructors

### constructor

• **new UICanvas**()

#### Inherited from

UICanvasBase.constructor

## Properties

### size

• **size**: [`Vector2`](WebSG.Vector2.md)

Gets the canvas size as a Vector2 in meters.

#### Inherited from

[UICanvasProps](../interfaces/WebSG.UICanvasProps.md).[size](../interfaces/WebSG.UICanvasProps.md#size)

#### Defined in

[src/engine/scripting/websg-api.d.ts:418](https://github.com/thirdroom/thirdroom/blob/3d97b348/src/engine/scripting/websg-api.d.ts#L418)

[packages/websg-types/types/websg.d.ts:1262](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L1262)

## Accessors

### height

• `get` **height**(): `number`

Gets the canvas height in pixels.

#### Returns

`number`

#### Inherited from

UICanvasProps.height

#### Defined in

[packages/websg-types/types/websg.d.ts:1245](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L1245)

• `set` **height**(`value`): `void`

Sets the canvas height in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The canvas height in pixels. |

#### Returns

`void`

#### Inherited from

UICanvasProps.height

#### Defined in

[packages/websg-types/types/websg.d.ts:1251](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L1251)

___

### root

• `get` **root**(): `undefined` \| [`UIElement`](WebSG.UIElement.md)

Gets the root UIElement of the canvas.

#### Returns

`undefined` \| [`UIElement`](WebSG.UIElement.md)

#### Inherited from

UICanvasProps.root

#### Defined in

[packages/websg-types/types/websg.d.ts:1223](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L1223)

• `set` **root**(`element`): `void`

Sets the root UIElement of the canvas.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element` | `undefined` \| [`UIElement`](WebSG.UIElement.md) | The root UIElement of the canvas. |

#### Returns

`void`

#### Inherited from

UICanvasProps.root

#### Defined in

[packages/websg-types/types/websg.d.ts:1229](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L1229)

___

### width

• `get` **width**(): `number`

Gets the canvas width in pixels.

#### Returns

`number`

#### Inherited from

UICanvasProps.width

#### Defined in

[packages/websg-types/types/websg.d.ts:1234](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L1234)

• `set` **width**(`value`): `void`

Sets the canvas width in pixels.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `number` | The canvas width in pixels. |

#### Returns

`void`

#### Inherited from

UICanvasProps.width

#### Defined in

[packages/websg-types/types/websg.d.ts:1240](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L1240)

## Methods

### redraw

▸ **redraw**(): `undefined`

Redraws the canvas.
This should be called any time the UI elements are changed.

#### Returns

`undefined`

#### Inherited from

[UICanvasBase](../interfaces/WebSG.UICanvasBase.md).[redraw](../interfaces/WebSG.UICanvasBase.md#redraw)

#### Defined in

[packages/websg-types/types/websg.d.ts:1257](https://github.com/thirdroom/thirdroom/blob/3d97b348/packages/websg-types/types/websg.d.ts#L1257)
