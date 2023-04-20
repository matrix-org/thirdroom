[Exports](../modules.md) / [WebSG](../modules/websg) / UICanvas

# Class: UICanvas

[WebSG](../modules/WebSG.md).UICanvas

Class representing a UICanvas.

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

• `Readonly` **size**: [`Vector2`](WebSG.Vector2.md)

Gets the canvas size as a Vector2 in meters.

#### Inherited from

[UICanvasProps](../interfaces/WebSG.UICanvasProps.md).[size](../interfaces/WebSG.UICanvasProps.md#size)

#### Defined in

[src/engine/scripting/websg-api.d.ts:418](https://github.com/matrix-org/thirdroom/blob/1005fb3d/src/engine/scripting/websg-api.d.ts#L418)

[packages/websg-types/types/websg.d.ts:1175](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1175)

## Accessors

### height

• `get` **height**(): `number`

Gets the canvas height in pixels.

#### Returns

`number`

#### Inherited from

UICanvasProps.height

#### Defined in

[packages/websg-types/types/websg.d.ts:1156](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1156)

---

### root

• `get` **root**(): [`UIElement`](WebSG.UIElement.md)

Gets the root UIElement of the canvas.

#### Returns

[`UIElement`](WebSG.UIElement.md)

#### Inherited from

UICanvasProps.root

#### Defined in

[packages/websg-types/types/websg.d.ts:1130](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1130)

---

### width

• `get` **width**(): `number`

Gets the canvas width in pixels.

#### Returns

`number`

#### Inherited from

UICanvasProps.width

#### Defined in

[packages/websg-types/types/websg.d.ts:1143](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1143)

## Methods

### redraw

▸ **redraw**(): `undefined`

Redraws the canvas.

#### Returns

`undefined`

#### Inherited from

[UICanvasBase](../interfaces/WebSG.UICanvasBase.md).[redraw](../interfaces/WebSG.UICanvasBase.md#redraw)

#### Defined in

[packages/websg-types/types/websg.d.ts:1168](https://github.com/matrix-org/thirdroom/blob/1005fb3d/packages/websg-types/types/websg.d.ts#L1168)
